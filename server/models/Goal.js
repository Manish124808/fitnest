const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['weight', 'steps', 'calories', 'workout', 'strength', 'custom'],
    required: true
  },
  title: { type: String, required: true },
  description: String,
  target: { type: Number, required: true },
  current: { type: Number, default: 0 },
  unit: { type: String, default: '' },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  status: { type: String, enum: ['active', 'completed', 'failed', 'paused'], default: 'active' },
  progress: [{
    date: Date,
    value: Number,
    note: String
  }],
  milestones: [{
    value: Number,
    label: String,
    achieved: { type: Boolean, default: false },
    achievedAt: Date
  }]
}, { timestamps: true });

goalSchema.index({ user: 1, status: 1 });

goalSchema.virtual('percentage').get(function() {
  if (!this.target) return 0;
  return Math.min(100, Math.round((this.current / this.target) * 100));
});

module.exports = mongoose.model('Goal', goalSchema);
