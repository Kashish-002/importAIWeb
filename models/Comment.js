import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
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
  text: {
    type: String,
    required: [true, 'Comment text is required'],
    trim: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  parent_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null // For nested replies
  },
  likes: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for performance
commentSchema.index({ blog_id: 1, createdAt: -1 });
commentSchema.index({ user_id: 1 });
commentSchema.index({ status: 1 });

const Comment = mongoose.model('Comment', commentSchema);
export default Comment;