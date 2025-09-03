import mongoose from "mongoose";

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Content is required']
  },
  excerpt: {
    type: String,
    maxlength: [500, 'Excerpt cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  author_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  featured_image: {
    type: String,
    default: ''
  },
  reading_time: {
    type: Number, // in minutes
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for performance
blogSchema.index({ slug: 1 });
blogSchema.index({ status: 1, createdAt: -1 });
blogSchema.index({ author_id: 1 });

// Pre-save middleware to calculate reading time
blogSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    const wordsPerMinute = 200;
    const wordCount = this.content.split(/\s+/).length;
    this.reading_time = Math.ceil(wordCount / wordsPerMinute);
    
    // Generate excerpt if not provided
    if (!this.excerpt && this.content) {
      this.excerpt = this.content.substring(0, 200) + '...';
    }
  }
  next();
});

const Blog = mongoose.model('Blog', blogSchema);
export default Blog;