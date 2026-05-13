const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  brand: { type: String, trim: true },
  barcode: { type: String },
  servingSize: { type: Number, default: 100 },
  servingUnit: { type: String, default: 'g' },
  calories: { type: Number, required: true },
  macros: {
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fats: { type: Number, default: 0 },
    fiber: { type: Number, default: 0 },
    sugar: { type: Number, default: 0 },
    saturatedFat: { type: Number, default: 0 }
  },
  micronutrients: {
    sodium: { type: Number },
    potassium: { type: Number },
    calcium: { type: Number },
    iron: { type: Number },
    vitaminC: { type: Number },
    vitaminD: { type: Number }
  },
  category: { type: String, enum: ['grain', 'protein', 'dairy', 'vegetable', 'fruit', 'fat', 'beverage', 'snack', 'supplement', 'other'], default: 'other' },
  isCustom: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isVerified: { type: Boolean, default: false },
  usageCount: { type: Number, default: 0 }
}, { timestamps: true });

foodSchema.index({ name: 'text', brand: 'text' });
foodSchema.index({ barcode: 1 });
foodSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Food', foodSchema);
