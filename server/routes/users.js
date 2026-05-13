const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/me
router.get('/me', protect, async (req, res) => {
  // Re-fetch to ensure fitStats and googleFit.connected are always fresh and serialized cleanly
  const user = await User.findById(req.user._id).lean();
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      profile: user.profile,
      targets: user.targets,
      streak: user.streak,
      isAdmin: user.isAdmin,
      savedRecipes: user.savedRecipes,
      notifications: user.notifications,
      fitStats: user.fitStats || {},
      googleFit: {
        connected: user.googleFit?.connected || false,
        lastSync: user.googleFit?.lastSync || null,
        googleId: user.googleFit?.googleId || null,
      },
    }
  });
});

// PUT /api/users/me
router.put('/me', protect, async (req, res) => {
  try {
    const allowedFields = ['name', 'profile', 'targets', 'notifications'];
    const updates = {};
    allowedFields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true, runValidators: true });
    res.json({ user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/users/search?q=name
router.get('/search', protect, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ users: [] });
    const users = await User.find({
      $and: [
        { $or: [{ name: { $regex: q, $options: 'i' } }, { email: { $regex: q, $options: 'i' } }] },
        { _id: { $ne: req.user._id } }
      ]
    }).select('name email avatar profile.goal streak').limit(10);
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/friend-request/:id
router.post('/friend-request/:id', protect, async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ error: 'User not found' });
    // FIX: use .some() + .equals() for ObjectId comparison
    if (target.friendRequests.some(id => id.equals(req.user._id))) {
      return res.status(400).json({ error: 'Request already sent' });
    }
    if (target.friends.some(id => id.equals(req.user._id))) {
      return res.status(400).json({ error: 'Already friends' });
    }
    target.friendRequests.push(req.user._id);
    await target.save();
    res.json({ message: 'Friend request sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/accept-friend/:id
router.post('/accept-friend/:id', protect, async (req, res) => {
  try {
    const me = await User.findById(req.user._id);
    const them = await User.findById(req.params.id);
    if (!them) return res.status(404).json({ error: 'User not found' });

    // FIX: use .toString() for consistent string comparison in filter/some
    me.friendRequests = me.friendRequests.filter(id => id.toString() !== req.params.id);
    if (!me.friends.some(id => id.equals(them._id))) me.friends.push(them._id);
    if (!them.friends.some(id => id.equals(me._id))) them.friends.push(me._id);
    await Promise.all([me.save(), them.save()]);
    res.json({ message: 'Friend added' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/friends
router.get('/friends', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('friends', 'name email avatar profile.goal streak lastActiveDate');
    res.json({ friends: user.friends });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/save-recipe/:id
router.put('/save-recipe/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    // FIX: use .toString() comparison since req.params.id is a string
    const idx = user.savedRecipes.findIndex(id => id.toString() === req.params.id);
    if (idx > -1) {
      user.savedRecipes.splice(idx, 1);
      await user.save();
      return res.json({ saved: false, message: 'Recipe unsaved' });
    }
    user.savedRecipes.push(req.params.id);
    await user.save();
    res.json({ saved: true, message: 'Recipe saved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
