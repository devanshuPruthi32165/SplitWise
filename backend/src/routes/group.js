const express = require('express');
const auth = require('../middleware/auth');
const Group = require('../models/Group');

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

module.exports = router;
