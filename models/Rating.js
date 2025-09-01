const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  blog_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog',
    required: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating_value: {
    type: Number,
    required: true,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  }
}, {
  timestamps: true
});

// Compound index to ensure one rating per user per blog
ratingSchema.index({ blog_id: 1, user_id: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);