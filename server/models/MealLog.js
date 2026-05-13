const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema({
  food:       { type: mongoose.Schema.Types.ObjectId, ref: 'Food' },
  customFood: { type: Object },
  servings:   { type: Number, default: 1 },
  calories:   { type: Number, default: 0 },
  macros: {
    protein: { type: Number, default: 0 },
    carbs:   { type: Number, default: 0 },
    fats:    { type: Number, default: 0 },
    fiber:   { type: Number, default: 0 },
  },
}, { _id: true });

const mealLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: String, required: true, index: true },   // YYYY-MM-DD
  meals: {
    breakfast: [entrySchema],
    lunch:     [entrySchema],
    dinner:    [entrySchema],
    snacks:    [entrySchema],
  },
  totals: {
    calories: { type: Number, default: 0 },
    protein:  { type: Number, default: 0 },
    carbs:    { type: Number, default: 0 },
    fats:     { type: Number, default: 0 },
    fiber:    { type: Number, default: 0 },
  },
  water: { type: Number, default: 0 }, // ml
}, { timestamps: true });

mealLogSchema.index({ user: 1, date: 1 }, { unique: true });

// Recalculate totals from all meal entries
mealLogSchema.methods.recalcTotals = function() {
  const totals = { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 };
  const allEntries = [
    ...this.meals.breakfast,
    ...this.meals.lunch,
    ...this.meals.dinner,
    ...this.meals.snacks,
  ];
  allEntries.forEach(e => {
    totals.calories += e.calories  || 0;
    totals.protein  += e.macros?.protein || 0;
    totals.carbs    += e.macros?.carbs   || 0;
    totals.fats     += e.macros?.fats    || 0;
    totals.fiber    += e.macros?.fiber   || 0;
  });
  totals.calories = Math.round(totals.calories);
  totals.protein  = Math.round(totals.protein  * 10) / 10;
  totals.carbs    = Math.round(totals.carbs    * 10) / 10;
  totals.fats     = Math.round(totals.fats     * 10) / 10;
  totals.fiber    = Math.round(totals.fiber    * 10) / 10;
  this.totals = totals;
};

module.exports = mongoose.model('MealLog', mealLogSchema);
