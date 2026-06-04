const express = require('express');
const auth = require('../middleware/auth');
const Group = require('../models/Group');
const User = require('../models/User');
const Expense = require('../models/Expense');
const Settlement = require('../models/Settlement');

const router = express.Router();

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id }).populate('members', 'name email');
    res.json({ groups });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Unable to load groups.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, memberIds = [] } = req.body;
    if (!name) return res.status(400).json({ message: 'Group name is required.' });

    const members = [req.user._id];
    for (const id of memberIds) {
      if (id && id.toString() !== req.user._id.toString()) {
        members.push(id);
      }
    }

    const group = await Group.create({ name, members, createdBy: req.user._id });
    const populatedGroup = await Group.findById(group._id).populate('members', 'name email');
    res.status(201).json({ group: populatedGroup });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Unable to create group.' });
  }
});

router.post('/:groupId/invite', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required to invite a member.' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    const isMember = group.members.some(memberId => memberId.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ message: 'Only group members can invite others.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ message: 'User with that email does not exist.' });
    }

    const alreadyInGroup = group.members.some(memberId => memberId.toString() === user._id.toString());
    if (alreadyInGroup) {
      return res.status(400).json({ message: 'User is already a member of this group.' });
    }

    group.members.push(user._id);
    await group.save();

    const populatedGroup = await Group.findById(group._id).populate('members', 'name email');
    res.status(200).json({ group: populatedGroup, message: 'Member added to group.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Unable to invite member.' });
  }
});

router.get('/:groupId/settlements', async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId).populate('members', 'name email');
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    const isMember = group.members.some(m => m._id.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: 'You are not a member of this group.' });

    const expenses = await Expense.find({ group: groupId })
      .populate('paidBy', 'name email')
      .populate('participants', 'name email');

    const settlements = await Settlement.find({ group: groupId }).populate('from to', 'name email createdAt');

    const balances = {};

    // initialize balances for group members
    group.members.forEach(member => {
      balances[member._id.toString()] = 0;
    });

    // For each expense: each participant owes `share`.
    // The payer should be credited with (amount - their share); others are debited by their share.
    expenses.forEach(expense => {
      const share = expense.amount / expense.participants.length;
      const paidById = expense.paidBy._id.toString();

      // ensure keys exist
      expense.participants.forEach(participant => {
        const pid = participant._id.toString();
        if (!(pid in balances)) balances[pid] = 0;
        if (!(paidById in balances)) balances[paidById] = 0;
      });

      // apply amounts
      expense.participants.forEach(participant => {
        const pid = participant._id.toString();
        if (pid === paidById) {
          balances[pid] += expense.amount - share;
        } else {
          balances[pid] -= share;
        }
      });
    });

    // apply settlements (from -> to reduces receiver's owed amount and increases payer's net)
    settlements.forEach(s => {
      const fromId = s.from._id.toString();
      const toId = s.to._id.toString();
      const amt = s.amount;

      if (!(fromId in balances)) balances[fromId] = 0;
      if (!(toId in balances)) balances[toId] = 0;

      // payer paid 'amt' to receiver: receiver is owed less, payer owes less
      balances[toId] -= amt;
      balances[fromId] += amt;
    });

    const result = group.members.map(m => ({
      userId: m._id,
      name: m.name,
      email: m.email,
      balance: balances[m._id.toString()] || 0
    }));

    // compute pairwise transfers to settle balances (greedy)
    const creditors = [];
    const debtors = [];

    Object.entries(balances).forEach(([userId, bal]) => {
      const amount = Math.round((bal + Number.EPSILON) * 100) / 100;
      if (amount > 0) creditors.push({ userId, amount });
      else if (amount < 0) debtors.push({ userId, amount });
    });

    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => a.amount - b.amount); // more negative first

    const transfers = [];
    let i = 0, j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const owe = -debtor.amount;
      const give = creditor.amount;
      const pay = Math.round((Math.min(owe, give) + Number.EPSILON) * 100) / 100;

      transfers.push({ from: debtor.userId, to: creditor.userId, amount: pay });

      debtor.amount += pay; // debtor.amount is negative
      creditor.amount -= pay;

      if (Math.abs(debtor.amount) < 0.01) i++;
      if (Math.abs(creditor.amount) < 0.01) j++;
    }

    // enrich transfers with user names/emails
    const memberMap = {};
    group.members.forEach(m => { memberMap[m._id.toString()] = { name: m.name, email: m.email }; });
    const enrichedTransfers = transfers.map(t => ({
      from: { userId: t.from, ...memberMap[t.from] },
      to: { userId: t.to, ...memberMap[t.to] },
      amount: t.amount
    }));

    res.json({ balances: result, expenses, settlements, transfers: enrichedTransfers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Unable to calculate group settlements.' });
  }
});

router.post('/:groupId/settle', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { toUserId, amount } = req.body;

    if (!toUserId || !amount || amount <= 0) {
      return res.status(400).json({ message: 'toUserId and positive amount are required.' });
    }

    const group = await Group.findById(groupId).populate('members', 'name email');
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    const isMember = group.members.some(m => m._id.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: 'You are not a member of this group.' });

    const toMember = group.members.find(m => m._id.toString() === toUserId.toString());
    if (!toMember) return res.status(400).json({ message: 'Recipient is not a member of the group.' });

    const settlement = await Settlement.create({ group: groupId, from: req.user._id, to: toUserId, amount, createdBy: req.user._id });

    // return updated settlements and balances
    const updatedReq = { params: { groupId }, user: req.user };
    // reuse logic by calling the settlements endpoint logic: compute fresh data
    const expenses = await Expense.find({ group: groupId })
      .populate('paidBy', 'name email')
      .populate('participants', 'name email');
    const settlementsAll = await Settlement.find({ group: groupId }).populate('from to', 'name email');

    const balances = {};
    group.members.forEach(member => { balances[member._id.toString()] = 0; });

    // apply expenses to balances
    expenses.forEach(expense => {
      const share = expense.amount / expense.participants.length;
      const paidById = expense.paidBy._id.toString();
      expense.participants.forEach(participant => {
        const pid = participant._id.toString();
        if (!(pid in balances)) balances[pid] = 0;
        if (!(paidById in balances)) balances[paidById] = 0;
      });
      expense.participants.forEach(participant => {
        const pid = participant._id.toString();
        if (pid === paidById) {
          balances[pid] += expense.amount - share;
        } else {
          balances[pid] -= share;
        }
      });
    });

    settlementsAll.forEach(s => {
      const fromId = s.from._id.toString();
      const toId = s.to._id.toString();
      const amt = s.amount;
      if (!(fromId in balances)) balances[fromId] = 0;
      if (!(toId in balances)) balances[toId] = 0;
      balances[toId] -= amt;
      balances[fromId] += amt;
    });

    const result = group.members.map(m => ({ userId: m._id, name: m.name, email: m.email, balance: balances[m._id.toString()] || 0 }));

    // compute transfers greedy
    const creditors = [];
    const debtors = [];
    Object.entries(balances).forEach(([userId, bal]) => {
      const amountVal = Math.round((bal + Number.EPSILON) * 100) / 100;
      if (amountVal > 0) creditors.push({ userId, amount: amountVal });
      else if (amountVal < 0) debtors.push({ userId, amount: amountVal });
    });
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => a.amount - b.amount);
    const transfers = [];
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const owe = -debtor.amount;
      const give = creditor.amount;
      const pay = Math.round((Math.min(owe, give) + Number.EPSILON) * 100) / 100;
      transfers.push({ from: debtor.userId, to: creditor.userId, amount: pay });
      debtor.amount += pay;
      creditor.amount -= pay;
      if (Math.abs(debtor.amount) < 0.01) i++;
      if (Math.abs(creditor.amount) < 0.01) j++;
    }

    const memberMap = {};
    group.members.forEach(m => { memberMap[m._id.toString()] = { name: m.name, email: m.email }; });
    const enrichedTransfers = transfers.map(t => ({ from: { userId: t.from, ...memberMap[t.from] }, to: { userId: t.to, ...memberMap[t.to] }, amount: t.amount }));

    res.status(201).json({ settlement, balances: result, settlements: settlementsAll, transfers: enrichedTransfers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Unable to record settlement.' });
  }
});

module.exports = router;
