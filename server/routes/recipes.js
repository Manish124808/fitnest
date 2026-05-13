const express = require('express');
const Recipe = require('../models/Recipe');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/recipes
router.get('/', protect, async (req, res) => {
  try {
    const { category, q, page = 1, limit = 20, mine } = req.query;
    const query = mine ? { author: req.user._id } : { isPublic: true };
    if (category) query.category = category;
    if (q) query.$text = { $search: q };
    const recipes = await Recipe.find(query).populate('author', 'name avatar').sort({ createdAt: -1 }).limit(Number(limit)).skip((page - 1) * limit);
    const total = await Recipe.countDocuments(query);
    res.json({ recipes, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/recipes/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id).populate('author', 'name avatar');
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
    res.json({ recipe });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/recipes
router.post('/', protect, async (req, res) => {
  try {
    const recipe = new Recipe({ ...req.body, author: req.user._id });
    recipe.calcNutrition();
    await recipe.save();
    res.status(201).json({ recipe });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/recipes/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const recipe = await Recipe.findOne({ _id: req.params.id, author: req.user._id });
    if (!recipe) return res.status(404).json({ error: 'Recipe not found or not yours' });
    // FIX: whitelist fields — never allow author/likes/saves to be overwritten
    const { name, description, emoji, category, ingredients, instructions,
            servings, cookTime, prepTime, difficulty, isPublic, tags } = req.body;
    if (name        !== undefined) recipe.name        = name;
    if (description !== undefined) recipe.description = description;
    if (emoji       !== undefined) recipe.emoji       = emoji;
    if (category    !== undefined) recipe.category    = category;
    if (ingredients !== undefined) recipe.ingredients = ingredients;
    if (instructions!== undefined) recipe.instructions= instructions;
    if (servings    !== undefined) recipe.servings    = servings;
    if (cookTime    !== undefined) recipe.cookTime    = cookTime;
    if (prepTime    !== undefined) recipe.prepTime    = prepTime;
    if (difficulty  !== undefined) recipe.difficulty  = difficulty;
    if (isPublic    !== undefined) recipe.isPublic    = isPublic;
    if (tags        !== undefined) recipe.tags        = tags;
    recipe.calcNutrition();
    await recipe.save();
    res.json({ recipe });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/recipes/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const r = await Recipe.findOneAndDelete({ _id: req.params.id, author: req.user._id });
    if (!r) return res.status(404).json({ error: 'Recipe not found' });
    res.json({ message: 'Recipe deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/recipes/:id/like
router.post('/:id/like', protect, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
    // FIX: use .equals() for proper ObjectId comparison
    const idx = recipe.likes.findIndex(id => id.equals(req.user._id));
    if (idx > -1) recipe.likes.splice(idx, 1);
    else recipe.likes.push(req.user._id);
    await recipe.save();
    res.json({ likes: recipe.likes.length, liked: idx === -1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
