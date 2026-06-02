const express = require('express');
const auth = require('../middleware/auth');
const Expense = require('../models/Expense');
const Group = require('../models/Group');

const router = express.Router();
router.use(auth);

router.get('/', async (req, res) => {
  try {
    const groupId = req.query.groupId;
    const query = { participants: req.user._id };
    if (groupId) query.group = groupId;

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

module.exports = router;
