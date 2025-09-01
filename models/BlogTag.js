const mongoose = require('mongoose');

const blogTagSchema = new mongoose.Schema({
  blog_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog',
    required: true
  },
  tag_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag',
    required: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate blog-tag combinations
blogTagSchema.index({ blog_id: 1, tag_id: 1 }, { unique: true });

module.exports = mongoose.model('BlogTag', blogTagSchema);