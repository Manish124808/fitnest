const express = require('express');
const Workout = require('../models/Workout');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/workouts/stats  — must be BEFORE /:id
router.get('/stats', protect, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().split('T')[0];

    const workouts = await Workout.find({ user: req.user._id, date: { $gte: sinceStr } });
    const stats = {
      totalWorkouts: workouts.length,
      totalDuration: workouts.reduce((s, w) => s + (w.duration || 0), 0),
      totalCalories: workouts.reduce((s, w) => s + (w.totalCaloriesBurned || 0), 0),
      totalVolume:   workouts.reduce((s, w) => s + (w.totalVolume || 0), 0),
      byType: {}
    };
    workouts.forEach(w => { stats.byType[w.type] = (stats.byType[w.type] || 0) + 1; });
    res.json({ stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/workouts?date=YYYY-MM-DD
router.get('/', protect, async (req, res) => {
  try {
    const { date, limit = 20, page = 1 } = req.query;
    const query = { user: req.user._id };
    if (date) query.date = date;
    const workouts = await Workout.find(query)
      .sort({ date: -1, createdAt: -1 })
      .limit(Number(limit))
      .skip((page - 1) * limit);
    const total = await Workout.countDocuments(query);
    res.json({ workouts, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/workouts
router.post('/', protect, async (req, res) => {
  try {
    const { name, type, exercises, duration, notes, rating, date } = req.body;
    const workout = await Workout.create({
      user: req.user._id,
      date: date || new Date().toISOString().split('T')[0],
      name:      name      || 'Workout',
      type:      type      || 'custom',
      exercises: exercises || [],
      duration, notes, rating
    });
    res.status(201).json({ workout });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/workouts/:id
router.put('/:id', protect, async (req, res) => {
  try {
    // FIX: whitelist fields — prevent user field from being overwritten
    const { name, type, exercises, duration, notes, rating, date, isCompleted } = req.body;
    const update = {};
    if (name        !== undefined) update.name        = name;
    if (type        !== undefined) update.type        = type;
    if (exercises   !== undefined) update.exercises   = exercises;
    if (duration    !== undefined) update.duration    = duration;
    if (notes       !== undefined) update.notes       = notes;
    if (rating      !== undefined) update.rating      = rating;
    if (date        !== undefined) update.date        = date;
    if (isCompleted !== undefined) update.isCompleted = isCompleted;

    const workout = await Workout.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!workout) return res.status(404).json({ error: 'Workout not found' });
    res.json({ workout });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/workouts/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const w = await Workout.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!w) return res.status(404).json({ error: 'Workout not found' });
    res.json({ message: 'Workout deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
