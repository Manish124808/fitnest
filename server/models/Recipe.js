const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
  food: { type: mongoose.Schema.Types.ObjectId, ref: 'Food' },
  name: String,
  amount: { type: Number, required: true },
  unit: { type: String, default: 'g' },
  calories: Number,
  macros: {
    protein: Number,
    carbs: Number,
    fats: Number
  }
});

const recipeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, maxlength: 500 },
  emoji: { type: String, default: '🍽️' },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: {
    type: String,
    enum: ['highProtein', 'lowCarb', 'vegetarian', 'vegan', 'quickMeal', 'bulking', 'cutting', 'other'],
    default: 'other'
  },
  ingredients: [ingredientSchema],
  instructions: [{ step: Number, text: String }],
  servings: { type: Number, default: 1 },
  cookTime: { type: Number }, // minutes
  prepTime: { type: Number }, // minutes
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'easy' },
  nutrition: {
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fats: { type: Number, default: 0 },
    fiber: { type: Number, default: 0 }
  },
  isPublic: { type: Boolean, default: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  saves: { type: Number, default: 0 },
  tags: [String]
}, { timestamps: true });

recipeSchema.index({ name: 'text', description: 'text', tags: 'text' });
recipeSchema.index({ author: 1, isPublic: 1 });
recipeSchema.index({ category: 1 });

// Auto-calculate nutrition from ingredients
recipeSchema.methods.calcNutrition = function() {
  const total = this.ingredients.reduce((acc, ing) => ({
    calories: acc.calories + (ing.calories || 0),
    protein: acc.protein + (ing.macros?.protein || 0),
    carbs: acc.carbs + (ing.macros?.carbs || 0),
    fats: acc.fats + (ing.macros?.fats || 0),
    fiber: acc.fiber + (ing.macros?.fiber || 0)
  }), { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 });

  const s = this.servings || 1;
  this.nutrition = {
    calories: Math.round(total.calories / s),
    protein: Math.round(total.protein / s),
    carbs: Math.round(total.carbs / s),
    fats: Math.round(total.fats / s),
    fiber: Math.round(total.fiber / s)
  };
};

module.exports = mongoose.model('Recipe', recipeSchema);
