const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

const router = express.Router();
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

// POST /api/auth/register
router.post('/register', [
  body('name').trim().isLength({ min:2, max:60 }).withMessage('Name must be 2-60 chars'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min:6 }).withMessage('Password min 6 chars'),
], validate, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'Email already registered' });

    const user = await User.create({ name, email, password, profile: req.body.profile || {} });
    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        _id: user._id, name: user.name, email: user.email,
        profile: user.profile, targets: user.targets,
        streak: user.streak, isAdmin: user.isAdmin,
        fitStats: user.fitStats ? user.fitStats.toObject ? user.fitStats.toObject() : user.fitStats : {},
        googleFit: { connected: false, lastSync: null },
        savedRecipes: [],
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], validate, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    if (!user.isActive) return res.status(403).json({ error: 'Account suspended. Contact admin.' });

    // Streak logic
    const today = new Date().toDateString();
    const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate).toDateString() : null;
    if (lastActive !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      user.streak = (lastActive === yesterday.toDateString()) ? (user.streak || 0) + 1 : 1;
      user.lastActiveDate = new Date();
      await user.save();
    }

    const token = generateToken(user._id);
    res.json({
      token,
      user: {
        _id: user._id, name: user.name, email: user.email,
        profile: user.profile, targets: user.targets,
        streak: user.streak, savedRecipes: user.savedRecipes,
        isAdmin: user.isAdmin,
        fitStats: user.fitStats ? (user.fitStats.toObject ? user.fitStats.toObject() : user.fitStats) : {},
        googleFit: { connected: user.googleFit?.connected || false, lastSync: user.googleFit?.lastSync || null },
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
