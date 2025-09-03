import mongoose from "mongoose";

const tagSchema = new mongoose.Schema({
  tag_name: {
    type: String,
    required: [true, 'Tag name is required'],
    unique: true,
    trim: true,
    lowercase: true,
    maxlength: [50, 'Tag name cannot exceed 50 characters']
  },
  description: {
    type: String,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  color: {
    type: String,
    default: '#3B82F6' // Default blue color
  },
  usage_count: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

tagSchema.index({ tag_name: 1 });

const Tag = mongoose.model('Tag', tagSchema);
export default Tag;