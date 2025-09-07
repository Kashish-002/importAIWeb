import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { Tag, BlogTag, Blog } from '../models';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Validation rules
const createTagValidation = [
  body('tag_name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Tag name must be between 1 and 50 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage('Tag name can only contain letters, numbers, spaces, hyphens, and underscores'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters'),
  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color must be a valid hex color code')
];

// @route   GET /api/tags
// @desc    Get all tags with usage statistics
// @access  Public
router.get('/', [
  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  query('sortBy')
    .optional()
    .isIn(['tag_name', 'usage_count', 'createdAt'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      search,
      sortBy = 'usage_count',
      sortOrder = 'desc',
      limit = 50
    } = req.query;

    // Build query
    let query = {};
    if (search) {
      query.tag_name = { $regex: search, $options: 'i' };
    }

    // Build sort
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Execute query
    const tags = await Tag.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: tags,
      count: tags.length
    });
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching tags'
    });
  }
});

// @route   GET /api/tags/popular
// @desc    Get most popular tags
// @access  Public
router.get('/popular', [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Limit must be between 1 and 20')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { limit = 10 } = req.query;

    const popularTags = await Tag.find({ usage_count: { $gt: 0 } })
      .sort({ usage_count: -1, tag_name: 1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: popularTags
    });
  } catch (error) {
    console.error('Get popular tags error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching popular tags'
    });
  }
});

// @route   POST /api/tags
// @desc    Create a new tag
// @access  Private (Admin only)
router.post('/', authenticate, authorize('Admin'), createTagValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { tag_name, description, color } = req.body;

    // Check if tag already exists
    const existingTag = await Tag.findOne({ 
      tag_name: tag_name.toLowerCase().trim() 
    });

    if (existingTag) {
      return res.status(400).json({
        success: false,
        message: 'Tag already exists'
      });
    }

    // Create new tag
    const tag = new Tag({
      tag_name: tag_name.toLowerCase().trim(),
      description: description?.trim(),
      color: color || '#3B82F6',
      usage_count: 0
    });

    await tag.save();

    res.status(201).json({
      success: true,
      message: 'Tag created successfully',
      data: tag
    });
  } catch (error) {
    console.error('Create tag error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating tag'
    });
  }
});

// @route   PUT /api/tags/:id
// @desc    Update a tag
// @access  Private (Admin only)
router.put('/:id', authenticate, authorize('Admin'), [
  param('id')
    .isMongoId()
    .withMessage('Invalid tag ID'),
  body('tag_name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Tag name must be between 1 and 50 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage('Tag name can only contain letters, numbers, spaces, hyphens, and underscores'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters'),
  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color must be a valid hex color code')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { tag_name, description, color } = req.body;

    // Check if tag exists
    const tag = await Tag.findById(id);
    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }

    // Check if new tag name already exists (if changing name)
    if (tag_name && tag_name.toLowerCase().trim() !== tag.tag_name) {
      const existingTag = await Tag.findOne({ 
        tag_name: tag_name.toLowerCase().trim(),
        _id: { $ne: id }
      });

      if (existingTag) {
        return res.status(400).json({
          success: false,
          message: 'Tag name already exists'
        });
      }
    }

    // Update tag
    const updateData = {};
    if (tag_name) updateData.tag_name = tag_name.toLowerCase().trim();
    if (description !== undefined) updateData.description = description.trim();
    if (color) updateData.color = color;

    const updatedTag = await Tag.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Tag updated successfully',
      data: updatedTag
    });
  } catch (error) {
    console.error('Update tag error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating tag'
    });
  }
});

// @route   DELETE /api/tags/:id
// @desc    Delete a tag
// @access  Private (Admin only)
router.delete('/:id', authenticate, authorize('Admin'), [
  param('id')
    .isMongoId()
    .withMessage('Invalid tag ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { id } = req.params;

    // Check if tag exists
    const tag = await Tag.findById(id);
    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }

    // Check if tag is being used
    const tagUsage = await BlogTag.countDocuments({ tag_id: id });
    if (tagUsage > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete tag. It is being used by ${tagUsage} blog(s). Remove the tag from all blogs first.`
      });
    }

    // Delete tag
    await Tag.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Tag deleted successfully'
    });
  } catch (error) {
    console.error('Delete tag error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting tag'
    });
  }
});

// @route   GET /api/tags/:id/blogs
// @desc    Get all blogs with a specific tag
// @access  Public
router.get('/:id/blogs', [
  param('id')
    .isMongoId()
    .withMessage('Invalid tag ID'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Check if tag exists
    const tag = await Tag.findById(id);
    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }

    // Get blog IDs with this tag
    const blogTags = await BlogTag.find({ tag_id: id }).select('blog_id');
    const blogIds = blogTags.map(bt => bt.blog_id);

    if (blogIds.length === 0) {
      return res.json({
        success: true,
        data: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          pages: 0
        },
        tag
      });
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get blogs
    const [blogs, total] = await Promise.all([
      Blog.find({ 
        _id: { $in: blogIds },
        status: 'published'
      })
        .populate('author_id', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Blog.countDocuments({ 
        _id: { $in: blogIds },
        status: 'published'
      })
    ]);

    res.json({
      success: true,
      data: blogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      tag
    });
  } catch (error) {
    console.error('Get tag blogs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching tag blogs'
    });
  }
});

// @route   GET /api/tags/suggest
// @desc    Get tag suggestions for autocomplete
// @access  Public
router.get('/suggest', [
  query('q')
    .isLength({ min: 1, max: 50 })
    .withMessage('Query must be between 1 and 50 characters'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Limit must be between 1 and 20')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { q, limit = 10 } = req.query;

    const suggestions = await Tag.find({
      tag_name: { $regex: q, $options: 'i' }
    })
      .sort({ usage_count: -1, tag_name: 1 })
      .limit(parseInt(limit))
      .select('tag_name color usage_count')
      .lean();

    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('Tag suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching tag suggestions'
    });
  }
});

export default router;