const express   = require('express');
const User      = require('../models/User');
const Food      = require('../models/Food');
const Recipe    = require('../models/Recipe');
const MealLog   = require('../models/MealLog');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Safely get Workout model
let Workout;
try { Workout = require('../models/Workout'); } catch (_) {}

// ── Public promote endpoint (no adminOnly — needed to bootstrap first admin) ──
// POST /api/admin/promote
router.post('/promote', protect, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'email required' });
    // Only allow if requester is already admin OR if target email === ADMIN_EMAIL env var
    const targetEmail = email.toLowerCase().trim();
    const isAdminEnv = process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL.toLowerCase().trim() === targetEmail;
    const isSelf = req.user.email === targetEmail;
    if (!req.user.isAdmin && !(isAdminEnv && isSelf)) {
      return res.status(403).json({ error: 'Not authorized. Only ADMIN_EMAIL can self-promote.' });
    }
    const user = await User.findOneAndUpdate(
      { email: targetEmail },
      { $set: { isAdmin: true, isActive: true } },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found. Register first then promote.' });
    res.json({ message: `${email} is now admin`, user });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// All routes below require admin
router.use(protect, adminOnly);

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const week  = new Date(Date.now() - 7  * 86400000);
    const month = new Date(Date.now() - 30 * 86400000);

    const [total, active, foods, recipes, mealLogs,
           newWeek, newMonth, activeWeek, workouts] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Food.countDocuments(),
      Recipe.countDocuments(),
      MealLog.countDocuments(),
      User.countDocuments({ createdAt: { $gte: week } }),
      User.countDocuments({ createdAt: { $gte: month } }),
      MealLog.distinct('user', { createdAt: { $gte: week } }),
      Workout ? Workout.countDocuments() : Promise.resolve(0),
    ]);

    const topFoods  = await Food.find().sort({ usageCount: -1 }).limit(5).select('name usageCount category');
    const regByDay  = await User.aggregate([
      { $match: { createdAt: { $gte: week } } },
      { $group: { _id: { $dateToString: { format:'%Y-%m-%d', date:'$createdAt' } }, count:{ $sum:1 } } },
      { $sort:  { _id: 1 } },
    ]);

    res.json({
      users:   { total, active, newThisWeek: newWeek, newThisMonth: newMonth, activeThisWeek: activeWeek.length },
      content: { foods, recipes, workouts, mealLogs },
      topFoods, regByDay,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/admin/activity — time-series data for charts
router.get('/activity', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const since = new Date(Date.now() - days * 86400000);

    const [mealActivity, userGrowth, topFoodsChart] = await Promise.all([
      MealLog.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format:'%Y-%m-%d', date:'$createdAt' } }, logs: { $sum:1 }, users: { $addToSet:'$user' } } },
        { $project: { _id:1, logs:1, activeUsers: { $size:'$users' } } },
        { $sort: { _id:1 } },
      ]),
      User.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format:'%Y-%m-%d', date:'$createdAt' } }, count: { $sum:1 } } },
        { $sort: { _id:1 } },
      ]),
      Food.find().sort({ usageCount:-1 }).limit(10).select('name usageCount category'),
    ]);

    res.json({ mealActivity, userGrowth, topFoodsChart });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const { page=1, limit=20, q, isAdmin, isActive } = req.query;
    const query = {};
    if (q) query.$or = [{ name:{$regex:q,$options:'i'} }, { email:{$regex:q,$options:'i'} }];
    if (isAdmin  !== undefined) query.isAdmin  = isAdmin  === 'true';
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const [users, total] = await Promise.all([
      User.find(query)
        .select('name email isAdmin isActive streak createdAt googleFit.connected fitStats')
        .sort({ createdAt: -1 })
        .skip((page-1)*limit).limit(Number(limit)),
      User.countDocuments(query),
    ]);
    res.json({ users, total, page:Number(page), pages:Math.ceil(total/limit) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/admin/users/:id
router.patch('/users/:id', async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString() && req.body.isAdmin === false)
      return res.status(400).json({ error: 'Cannot remove your own admin rights' });
    // FIX: only allow safe admin-controllable fields — never touch password or sensitive tokens
    const { isAdmin, isActive, name } = req.body;
    const safe = {};
    if (isAdmin  !== undefined) safe.isAdmin  = isAdmin;
    if (isActive !== undefined) safe.isActive = isActive;
    if (name     !== undefined) safe.name     = name;
    const user = await User.findByIdAndUpdate(req.params.id, { $set: safe }, { new: true })
      .select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString())
      return res.status(400).json({ error: 'Cannot delete yourself' });
    await User.findByIdAndDelete(req.params.id);
    await MealLog.deleteMany({ user: req.params.id });
    if (Workout) await Workout.deleteMany({ user: req.params.id });
    res.json({ message: 'User deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/admin/foods
router.get('/foods', async (req, res) => {
  try {
    const { page=1, limit=20, q } = req.query;
    const query = {};
    if (q) query.$or = [{ name:{$regex:q,$options:'i'} }, { brand:{$regex:q,$options:'i'} }];
    const [foods, total] = await Promise.all([
      Food.find(query).populate('createdBy','name email').sort({ usageCount:-1, createdAt:-1 })
        .skip((page-1)*limit).limit(Number(limit)),
      Food.countDocuments(query),
    ]);
    res.json({ foods, total, page:Number(page), pages:Math.ceil(total/limit) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/admin/foods/:id
router.patch('/foods/:id', async (req, res) => {
  try {
    const food = await Food.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!food) return res.status(404).json({ error: 'Not found' });
    res.json({ food });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE /api/admin/foods/:id
router.delete('/foods/:id', async (req, res) => {
  try {
    await Food.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/admin/recipes
router.get('/recipes', async (req, res) => {
  try {
    const { page=1, limit=20 } = req.query;
    const [recipes, total] = await Promise.all([
      Recipe.find().populate('author','name email').sort({ createdAt:-1 })
        .skip((page-1)*limit).limit(Number(limit)),
      Recipe.countDocuments(),
    ]);
    res.json({ recipes, total, page:Number(page), pages:Math.ceil(total/limit) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/admin/recipes/:id
router.patch('/recipes/:id', async (req, res) => {
  try {
    const recipe = await Recipe.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!recipe) return res.status(404).json({ error: 'Not found' });
    res.json({ recipe });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE /api/admin/recipes/:id
router.delete('/recipes/:id', async (req, res) => {
  try {
    await Recipe.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
