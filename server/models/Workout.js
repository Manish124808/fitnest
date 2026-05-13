const mongoose = require('mongoose');

const setSchema = new mongoose.Schema({
  reps: Number,
  weight: Number,
  weightUnit: { type: String, enum: ['kg', 'lbs'], default: 'kg' },
  duration: Number, // seconds
  distance: Number, // km
  restTime: Number, // seconds
  completed: { type: Boolean, default: true },
  notes: String
});

const exerciseLogSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: {
    type: String,
    enum: ['chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'cardio', 'fullBody', 'other'],
    default: 'other'
  },
  type: { type: String, enum: ['strength', 'cardio', 'hiit', 'flexibility', 'sports'], default: 'strength' },
  sets: [setSchema],
  duration: Number, // minutes (for cardio)
  distance: Number, // km
  caloriesBurned: Number,
  notes: String
});

const workoutSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  name: { type: String, default: 'Workout' },
  type: { type: String, enum: ['push', 'pull', 'legs', 'upper', 'lower', 'full', 'cardio', 'custom'], default: 'custom' },
  exercises: [exerciseLogSchema],
  duration: { type: Number }, // minutes
  totalCaloriesBurned: { type: Number, default: 0 },
  totalVolume: { type: Number, default: 0 }, // kg lifted
  notes: { type: String, maxlength: 500 },
  rating: { type: Number, min: 1, max: 5 },
  isCompleted: { type: Boolean, default: true }
}, { timestamps: true });

workoutSchema.index({ user: 1, date: -1 });

// Calculate totals before save
workoutSchema.pre('save', function(next) {
  this.totalCaloriesBurned = this.exercises.reduce((s, e) => s + (e.caloriesBurned || 0), 0);
  this.totalVolume = this.exercises.reduce((s, e) => {
    if (e.type === 'strength') {
      return s + e.sets.reduce((ss, set) => ss + ((set.weight || 0) * (set.reps || 0)), 0);
    }
    return s;
  }, 0);
  next();
});

module.exports = mongoose.model('Workout', workoutSchema);
