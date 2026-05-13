const express = require('express');
const Goal = require('../models/Goal');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const goals = await Goal.find({ user: req.user._id, status: req.query.status || 'active' });
    res.json({ goals });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const goal = await Goal.create({ ...req.body, user: req.user._id });
    res.status(201).json({ goal });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id/progress', protect, async (req, res) => {
  try {
    const { value, note } = req.body;
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
    if (!goal) return res.status(404).json({ error: 'Goal not found' });
    goal.current = value;
    goal.progress.push({ date: new Date(), value, note });
    if (value >= goal.target) goal.status = 'completed';
    // Check milestones
    goal.milestones.forEach(m => {
      if (!m.achieved && value >= m.value) {
        m.achieved = true;
        m.achievedAt = new Date();
      }
    });
    await goal.save();
    res.json({ goal });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    await Goal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ message: 'Goal deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
