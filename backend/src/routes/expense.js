const express = require('express');
const auth = require('../middleware/auth');
const Expense = require('../models/Expense');
const Group = require('../models/Group');

const router = express.Router();
router.use(auth);

router.get('/', async (req, res) => {
  try {
    const groupId = req.query.groupId;
    let query;

    if (groupId) {
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ message: 'Group not found.' });
      }

      const isGroupMember = group.members.some(memberId => memberId.toString() === req.user._id.toString());
      if (!isGroupMember) {
        return res.status(403).json({ message: 'You are not a member of this group.' });
      }

      query = { group: groupId };
    } else {
      const groups = await Group.find({ members: req.user._id }, '_id');
      const groupIds = groups.map(g => g._id);
      query = { group: { $in: groupIds } };
    }

    const expenses = await Expense.find(query)
      .populate('group', 'name')
      .populate('paidBy', 'name email')
      .populate('participants', 'name email')
      .sort({ createdAt: -1 });

    res.json({ expenses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Unable to load expenses.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { groupId, description, amount, participantIds } = req.body;
    if (!groupId || !description || !amount || !participantIds?.length) {
      return res.status(400).json({ message: 'Group, description, amount, and participants are required.' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    const expense = await Expense.create({
      group: group._id,
      description,
      amount,
      paidBy: req.user._id,
      participants: participantIds
    });

    const populatedExpense = await Expense.findById(expense._id)
      .populate('group', 'name')
      .populate('paidBy', 'name email')
      .populate('participants', 'name email');

    res.status(201).json({ expense: populatedExpense });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Unable to create expense.' });
  }
});

router.delete('/:expenseId', async (req, res) => {
  try {
    const { expenseId } = req.params;
    const expense = await Expense.findById(expenseId);
    if (!expense) return res.status(404).json({ message: 'Expense not found.' });

    // only the user who paid can delete the expense
    if (expense.paidBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the payer can delete this expense.' });
    }

    await Expense.findByIdAndDelete(expenseId);
    res.json({ message: 'Expense deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Unable to delete expense.' });
  }
});

router.patch('/:expenseId', async (req, res) => {
  try {
    const { expenseId } = req.params;
    const { description, amount, participantIds } = req.body;

    const expense = await Expense.findById(expenseId);
    if (!expense) return res.status(404).json({ message: 'Expense not found.' });

    // only the user who paid can edit the expense
    if (expense.paidBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the payer can edit this expense.' });
    }

    if (description) expense.description = description;
    if (amount && amount > 0) expense.amount = amount;
    if (participantIds && Array.isArray(participantIds) && participantIds.length > 0) {
      expense.participants = participantIds;
    }

    await expense.save();

    const populatedExpense = await Expense.findById(expense._id)
      .populate('group', 'name')
      .populate('paidBy', 'name email')
      .populate('participants', 'name email');

    res.json({ expense: populatedExpense });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Unable to update expense.' });
  }
});

module.exports = router;
