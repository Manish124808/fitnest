const express  = require('express');
const MealLog  = require('../models/MealLog');
const Food     = require('../models/Food');
const { protect } = require('../middleware/auth');

const router = express.Router();

const todayStr = () => new Date().toISOString().split('T')[0];

// GET /api/nutrition?date=YYYY-MM-DD
router.get('/', protect, async (req, res) => {
  try {
    const date = req.query.date || todayStr();
    let log = await MealLog.findOne({ user: req.user._id, date })
      .populate('meals.breakfast.food meals.lunch.food meals.dinner.food meals.snacks.food');

    if (!log) {
      // Return an empty log shape — don't save it until something is added
      return res.json({ log: {
        user: req.user._id, date,
        meals: { breakfast: [], lunch: [], dinner: [], snacks: [] },
        totals: { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 },
        water: 0,
      }});
    }

    // Ensure totals exist even for old documents without recalcTotals
    if (!log.totals || log.totals.calories === undefined) {
      log.recalcTotals();
      await log.save();
    }

    res.json({ log });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/nutrition/add
router.post('/add', protect, async (req, res) => {
  try {
    const { date, mealType, foodId, customFood, servings = 1 } = req.body;
    const d = date || todayStr();

    let log = await MealLog.findOne({ user: req.user._id, date: d });
    if (!log) {
      log = new MealLog({ user: req.user._id, date: d,
        meals: { breakfast: [], lunch: [], dinner: [], snacks: [] } });
    }

    let entry;
    if (foodId) {
      const food = await Food.findById(foodId);
      if (!food) return res.status(404).json({ error: 'Food not found' });

      // ratio = number of servings (calories in DB are already per one full serving)
      const ratio = Number(servings);
      entry = {
        food:     foodId,
        servings: Number(servings),
        calories: Math.round((food.calories || 0) * ratio),
        macros: {
          protein: Math.round((food.macros?.protein || 0) * ratio * 10) / 10,
          carbs:   Math.round((food.macros?.carbs   || 0) * ratio * 10) / 10,
          fats:    Math.round((food.macros?.fats    || 0) * ratio * 10) / 10,
          fiber:   Math.round((food.macros?.fiber   || 0) * ratio * 10) / 10,
        },
      };
      await Food.findByIdAndUpdate(foodId, { $inc: { usageCount: 1 } });
    } else if (customFood) {
      entry = {
        customFood,
        servings: 1,
        calories: Number(customFood.calories) || 0,
        macros: {
          protein: Number(customFood.protein || customFood.macros?.protein) || 0,
          carbs:   Number(customFood.carbs   || customFood.macros?.carbs)   || 0,
          fats:    Number(customFood.fats    || customFood.macros?.fats)    || 0,
          fiber:   0,
        },
      };
    } else {
      return res.status(400).json({ error: 'foodId or customFood required' });
    }

    const meal = ['breakfast','lunch','dinner','snacks'].includes(mealType) ? mealType : 'snacks';
    log.meals[meal].push(entry);
    log.recalcTotals();
    await log.save();

    // Populate food refs before returning
    await log.populate('meals.breakfast.food meals.lunch.food meals.dinner.food meals.snacks.food');
    res.json({ log });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/nutrition/remove
router.delete('/remove', protect, async (req, res) => {
  try {
    const { date, mealType, entryId } = req.body;
    const log = await MealLog.findOne({ user: req.user._id, date });
    if (!log) return res.status(404).json({ error: 'Log not found' });

    const meal = ['breakfast','lunch','dinner','snacks'].includes(mealType) ? mealType : 'snacks';
    log.meals[meal] = log.meals[meal].filter(e => e._id.toString() !== entryId);
    log.recalcTotals();
    await log.save();
    await log.populate('meals.breakfast.food meals.lunch.food meals.dinner.food meals.snacks.food');
    res.json({ log });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/nutrition/water
router.put('/water', protect, async (req, res) => {
  try {
    const { date, water } = req.body;
    const d = date || todayStr();
    const log = await MealLog.findOneAndUpdate(
      { user: req.user._id, date: d },
      {
        $set: { water: Number(water) || 0 },
        $setOnInsert: {
          meals: { breakfast: [], lunch: [], dinner: [], snacks: [] },
          totals: { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 },
        },
      },
      { new: true, upsert: true }
    );
    res.json({ water: log.water });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/nutrition/history?days=7
router.get('/history', protect, async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 7, 90);
    const dates = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    const logs = await MealLog.find({ user: req.user._id, date: { $in: dates } })
      .select('date totals water');
    const map = {};
    logs.forEach(l => { map[l.date] = l; });
    const history = dates.map(date => map[date] || {
      date, totals: { calories:0, protein:0, carbs:0, fats:0 }, water: 0
    });
    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
