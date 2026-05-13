const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: { type: String, required: true, maxlength: 300 },
  createdAt: { type: Date, default: Date.now }
});

const postSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, maxlength: 500 },
  type: { type: String, enum: ['update', 'achievement', 'workout', 'meal', 'progress'], default: 'update' },
  data: {
    calories: Number,
    steps: Number,
    workoutName: String,
    weightLost: Number,
    achievement: String
  },
  image: String,
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [commentSchema],
  visibility: { type: String, enum: ['public', 'friends'], default: 'friends' }
}, { timestamps: true });

postSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
