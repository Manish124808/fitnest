const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true, maxlength: 60 },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  avatar:   { type: String, default: '' },

  isAdmin:  { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },

  profile: {
    age:          { type: Number, min: 10, max: 120 },
    gender:       { type: String, enum: ['male','female','other',''] },
    height:       { type: Number },
    weight:       { type: Number },
    targetWeight: { type: Number },
    goal:         { type: String, enum: ['cutting','bulking','maintenance','performance'], default: 'maintenance' },
    activityLevel:{ type: String, enum: ['sedentary','light','moderate','active','veryActive'], default: 'moderate' },
  },
  targets: {
    calories: { type: Number, default: 2000 },
    protein:  { type: Number, default: 150 },
    carbs:    { type: Number, default: 200 },
    fats:     { type: Number, default: 65 },
    steps:    { type: Number, default: 10000 },
    water:    { type: Number, default: 3000 },
  },

  // ── Health Connect (replaces Google Fit on Android 14+) ──────
  // No OAuth tokens needed — data is pushed from the PWA on-device.
  healthConnect: {
    connected:   { type: Boolean, default: false },
    connectedAt: { type: Date },
    lastSync:    { type: Date },
  },

  // ── Google Fit tokens (kept for legacy / non-Android users) ──
  // NOTE: To read these, use User.getTokens(userId) static method
  //       Do NOT use .select('+googleFit.accessToken') — it silently
  //       fails for nested subdocument fields in Mongoose.
  googleFit: {
    connected:    { type: Boolean, default: false },
    accessToken:  { type: String,  select: false },
    refreshToken: { type: String,  select: false },
    tokenExpiry:  { type: Date,    select: false },
    googleId:     { type: String },
    lastSync:     { type: Date },
  },

  // ── Cached Google Fit stats (updated on every sync) ───────────
  fitStats: {
    steps:          { type: Number, default: 0 },
    caloriesBurned: { type: Number, default: 0 },
    activeMinutes:  { type: Number, default: 0 },
    distance:       { type: Number, default: 0 },   // meters
    heartRate:      { type: Number, default: 0 },   // bpm average
    sleep:          { type: Number, default: 0 },   // hours
    weight:         { type: Number, default: 0 },   // kg (from Google Fit)
    spo2:           { type: Number, default: 0 },   // % oxygen saturation
    workoutSessions: { type: Array, default: [] },   // from Google Fit sessions
    lastUpdated:     { type: Date },
    source:          { type: String, default: '' },  // 'googlefit' | 'healthconnect' | ''
  },

  streak:         { type: Number, default: 0 },
  lastActiveDate: { type: Date },
  savedRecipes:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }],
  friends:        [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  notifications: {
    mealReminder:    { type: Boolean, default: true },
    workoutReminder: { type: Boolean, default: true },
    reminderTime:    { type: String,  default: '08:00' },
  },
}, { timestamps: true });

// ── Hash password ────────────────────────────────────────────────
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ── Auto-promote admin by env email ────────────────────────────
userSchema.pre('save', function(next) {
  if (this.isNew && process.env.ADMIN_EMAIL &&
      this.email === process.env.ADMIN_EMAIL.toLowerCase()) {
    this.isAdmin = true;
  }
  next();
});

userSchema.methods.comparePassword = async function(pw) {
  return bcrypt.compare(pw, this.password);
};

userSchema.methods.calculateTDEE = function() {
  const { age, gender, height, weight, activityLevel } = this.profile || {};
  if (!age || !height || !weight) return 2000;
  const bmr = gender === 'female'
    ? 447.593 + (9.247*weight) + (3.098*height) - (4.330*age)
    : 88.362  + (13.397*weight) + (4.799*height) - (5.677*age);
  const mult = { sedentary:1.2, light:1.375, moderate:1.55, active:1.725, veryActive:1.9 };
  return Math.round(bmr * (mult[activityLevel] || 1.55));
};

// ── Static: safely retrieve tokens (bypasses select:false) ──────
userSchema.statics.getTokens = async function(userId) {
  // Using lean() with explicit projection to read select:false fields
  return this.findById(userId)
    .select('googleFit')
    .lean();
};

module.exports = mongoose.model('User', userSchema);
