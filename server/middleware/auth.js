const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ── Standard auth middleware ──────────────────────────────────────
const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null;

    if (!token) return res.status(401).json({ error: 'Not authorized, no token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ error: 'User not found' });
    if (!user.isActive) return res.status(403).json({ error: 'Account suspended' });

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token invalid or expired' });
  }
};

// ── Admin-only middleware ────────────────────────────────────────
const adminOnly = async (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin access required' });
  next();
};

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '30d' });

module.exports = { protect, adminOnly, generateToken };
