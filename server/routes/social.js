const express = require('express');
const Post = require('../models/Post');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/social/feed
router.get('/feed', protect, async (req, res) => {
  try {
    const me = await User.findById(req.user._id);
    const feedUsers = [req.user._id, ...me.friends];
    const posts = await Post.find({ user: { $in: feedUsers } })
      .populate('user', 'name avatar')
      .populate('comments.user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ posts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/social/post
router.post('/post', protect, async (req, res) => {
  try {
    const post = await Post.create({ ...req.body, user: req.user._id });
    await post.populate('user', 'name avatar');
    res.status(201).json({ post });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/social/:id/like
router.post('/:id/like', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    // FIX: use .equals() for proper ObjectId comparison
    const idx = post.likes.findIndex(id => id.equals(req.user._id));
    if (idx > -1) post.likes.splice(idx, 1);
    else post.likes.push(req.user._id);
    await post.save();
    res.json({ likes: post.likes.length, liked: idx === -1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/social/:id/comment
router.post('/:id/comment', protect, async (req, res) => {
  try {
    const { text } = req.body;
    // FIX: validate comment text before pushing
    if (!text || !text.trim()) return res.status(400).json({ error: 'Comment text required' });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    post.comments.push({ user: req.user._id, text: text.trim() });
    await post.save();
    await post.populate('comments.user', 'name avatar');
    res.json({ post });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
