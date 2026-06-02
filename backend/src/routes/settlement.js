const express = require('express');
const auth = require('../middleware/auth');
const Expense = require('../models/Expense');

const router = express.Router();
router.use(auth);

router.get('/', async (req, res) => {
  try {
    const expenses = await Expense.find({ participants: req.user._id })
      .populate('paidBy', 'name email')
      .populate('participants', 'name email')
      .populate('group', 'name');

    const settlements = [];
    const balances = {};

    expenses.forEach((expense) => {
      const share = expense.amount / expense.participants.length;
      expense.participants.forEach((participant) => {
        const participantId = participant._id.toString();
        if (!balances[participantId]) balances[participantId] = 0;
        if (!balances[expense.paidBy._id.toString()]) balances[expense.paidBy._id.toString()] = 0;

        if (participantId === expense.paidBy._id.toString()) {
          balances[participantId] += expense.amount - share;
        } else {
          balances[participantId] -= share;
          balances[expense.paidBy._id.toString()] += share;
        }
      });
    });

    Object.entries(balances).forEach(([userId, balance]) => {
      settlements.push({ userId, balance });
    });

    res.json({ settlements, expenses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Unable to calculate settlements.' });
  }
});

module.exports = router;
