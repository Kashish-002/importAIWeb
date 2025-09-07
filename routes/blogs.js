import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import {Blog, BlogTag, Tag, Comment, Rating, User } from '../models/index.js';
import {authenticate, authorize, checkOwnership, optionalAuth } from '../middleware/auth.js';
import { sanitizeContent, rateLimits } from '../middleware/security.js';

const router = express.Router();

// Helper function to generate slug from title
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
};

// Validation rules
const createBlogValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('content')
    .isLength({ min: 50 })
    .withMessage('Content must be at least 50 characters long'),
  body('excerpt')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Excerpt cannot exceed 500 characters'),
  body('status')
    .isIn(['draft', 'published'])
    .withMessage('Status must be either draft or published'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('featured_image')
    .optional()
    .isURL()
    .withMessage('Featured image must be a valid URL')
];

const updateBlogValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('content')
    .optional()
    .isLength({ min: 50 })
    .withMessage('Content must be at least 50 characters long'),
  body('excerpt')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Excerpt cannot exceed 500 characters'),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Status must be draft, published, or archived'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
];

// @route   GET /api/blogs
// @desc    Get all published blogs (with pagination, filtering, search)
// @access  Public
router.get('/', optionalAuth, [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Invalid status'),
  query('search')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters'),
  query('tags')
    .optional()
    .customSanitizer(value => value.split(',').map(tag => tag.trim())),
  query('author')
    .optional()
    .isMongoId()
    .withMessage('Invalid author ID'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'views', 'likes', 'title'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
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
      page = 1,
      limit = 10,
      status,
      search,
      tags,
      author,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    let query = {};

    // Filter by status (default to published for non-authenticated users)
    if (req.user && req.user.role === 'Admin') {
      if (status) query.status = status;
    } else {
      query.status = 'published';
    }

    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by author
    if (author) {
      query.author_id = author;
    }

    // Filter by tags
    if (tags && tags.length > 0) {
      const tagObjects = await Tag.find({ tag_name: { $in: tags } });
      const tagIds = tagObjects.map(tag => tag._id);
      
      if (tagIds.length > 0) {
        const blogTags = await BlogTag.find({ tag_id: { $in: tagIds } });
        const blogIds = blogTags.map(bt => bt.blog_id);
        query._id = { $in: blogIds };
      } else {
        // If no matching tags found, return empty result
        return res.json({
          success: true,
          data: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0
          }
        });
      }
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Execute query
    const [blogs, total] = await Promise.all([
      Blog.find(query)
        .populate('author_id', 'name avatar')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Blog.countDocuments(query)
    ]);

    // Get tags for each blog
    const blogsWithTags = await Promise.all(
      blogs.map(async (blog) => {
        const blogTags = await BlogTag.find({ blog_id: blog._id })
          .populate('tag_id', 'tag_name color')
          .lean();
        
        return {
          ...blog,
          tags: blogTags.map(bt => bt.tag_id)
        };
      })
    );

    res.json({
      success: true,
      data: blogsWithTags,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get blogs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching blogs'
    });
  }
});

// @route   GET /api/blogs/:slug
// @desc    Get blog by slug
// @access  Public
router.get('/:slug', optionalAuth, [
  param('slug')
    .isLength({ min: 1, max: 200 })
    .withMessage('Invalid slug')
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

    const { slug } = req.params;

    // Find blog by slug
    let query = { slug };
    
    // If user is not admin, only show published blogs
    if (!req.user || req.user.role !== 'Admin') {
      query.status = 'published';
    }

    const blog = await Blog.findOne(query)
      .populate('author_id', 'name avatar')
      .lean();

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Get tags
    const blogTags = await BlogTag.find({ blog_id: blog._id })
      .populate('tag_id', 'tag_name color')
      .lean();

    // Get comments count
    const commentsCount = await Comment.countDocuments({ 
      blog_id: blog._id, 
      status: 'approved' 
    });

    // Get average rating
    const ratingStats = await Rating.aggregate([
      { $match: { blog_id: blog._id } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating_value' },
          totalRatings: { $sum: 1 }
        }
      }
    ]);

    // Increment view count (only for published blogs)
    if (blog.status === 'published') {
      await Blog.findByIdAndUpdate(blog._id, { $inc: { views: 1 } });
      blog.views += 1;
    }

    res.json({
      success: true,
      data: {
        ...blog,
        tags: blogTags.map(bt => bt.tag_id),
        commentsCount,
        averageRating: ratingStats.length > 0 ? ratingStats[0].averageRating : 0,
        totalRatings: ratingStats.length > 0 ? ratingStats[0].totalRatings : 0
      }
    });
  } catch (error) {
    console.error('Get blog by slug error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching blog'
    });
  }
});

// @route   POST /api/blogs
// @desc    Create new blog
// @access  Private (Admin or Author)
router.post('/', authenticate, authorize('Admin'), rateLimits.blogCreate, sanitizeContent, createBlogValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { title, content, excerpt, status, tags, featured_image } = req.body;

    // Generate slug from title
    let slug = generateSlug(title);
    
    // Ensure slug is unique
    let existingBlog = await Blog.findOne({ slug });
    let counter = 1;
    const originalSlug = slug;
    
    while (existingBlog) {
      slug = `${originalSlug}-${counter}`;
      existingBlog = await Blog.findOne({ slug });
      counter++;
    }

    // Create blog
    const blog = new Blog({
      title,
      slug,
      content,
      excerpt,
      status: status || 'draft',
      author_id: req.user._id,
      featured_image
    });

    await blog.save();

    // Handle tags
    if (tags && tags.length > 0) {
      for (const tagName of tags) {
        // Find or create tag
        let tag = await Tag.findOne({ tag_name: tagName.toLowerCase().trim() });
        
        if (!tag) {
          tag = new Tag({
            tag_name: tagName.toLowerCase().trim(),
            usage_count: 1
          });
          await tag.save();
        } else {
          await Tag.findByIdAndUpdate(tag._id, { $inc: { usage_count: 1 } });
        }

        // Create blog-tag relationship
        const blogTag = new BlogTag({
          blog_id: blog._id,
          tag_id: tag._id
        });
        await blogTag.save();
      }
    }

    // Populate and return the created blog
    const populatedBlog = await Blog.findById(blog._id)
      .populate('author_id', 'name avatar')
      .lean();

    // Get tags
    const blogTags = await BlogTag.find({ blog_id: blog._id })
      .populate('tag_id', 'tag_name color')
      .lean();

    res.status(201).json({
      success: true,
      message: 'Blog created successfully',
      data: {
        ...populatedBlog,
        tags: blogTags.map(bt => bt.tag_id)
      }
    });
  } catch (error) {
    console.error('Create blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating blog'
    });
  }
});

// @route   PUT /api/blogs/:id
// @desc    Update blog
// @access  Private (Admin or Blog Author)
router.put('/:id', authenticate, checkOwnership(Blog), sanitizeContent, updateBlogValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { title, content, excerpt, status, tags, featured_image } = req.body;
    const blog = req.resource; // Set by checkOwnership middleware

    // Update basic fields
    const updateData = {};
    if (title !== undefined) {
      updateData.title = title;
      // Regenerate slug if title changed
      if (title !== blog.title) {
        let newSlug = generateSlug(title);
        let existingBlog = await Blog.findOne({ slug: newSlug, _id: { $ne: blog._id } });
        let counter = 1;
        const originalSlug = newSlug;
        
        while (existingBlog) {
          newSlug = `${originalSlug}-${counter}`;
          existingBlog = await Blog.findOne({ slug: newSlug, _id: { $ne: blog._id } });
          counter++;
        }
        
        updateData.slug = newSlug;
      }
    }
    if (content !== undefined) updateData.content = content;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (status !== undefined) updateData.status = status;
    if (featured_image !== undefined) updateData.featured_image = featured_image;

    // Update the blog
    const updatedBlog = await Blog.findByIdAndUpdate(
      blog._id,
      updateData,
      { new: true, runValidators: true }
    ).populate('author_id', 'name avatar');

    // Handle tags update
    if (tags !== undefined) {
      // Remove existing blog-tag relationships
      await BlogTag.deleteMany({ blog_id: blog._id });

      // Add new tags
      for (const tagName of tags) {
        let tag = await Tag.findOne({ tag_name: tagName.toLowerCase().trim() });
        
        if (!tag) {
          tag = new Tag({
            tag_name: tagName.toLowerCase().trim(),
            usage_count: 1
          });
          await tag.save();
        } else {
          await Tag.findByIdAndUpdate(tag._id, { $inc: { usage_count: 1 } });
        }

        const blogTag = new BlogTag({
          blog_id: blog._id,
          tag_id: tag._id
        });
        await blogTag.save();
      }
    }

    // Get updated tags
    const blogTags = await BlogTag.find({ blog_id: blog._id })
      .populate('tag_id', 'tag_name color')
      .lean();

    res.json({
      success: true,
      message: 'Blog updated successfully',
      data: {
        ...updatedBlog.toObject(),
        tags: blogTags.map(bt => bt.tag_id)
      }
    });
  } catch (error) {
    console.error('Update blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating blog'
    });
  }
});

// @route   DELETE /api/blogs/:id
// @desc    Delete blog
// @access  Private (Admin or Blog Author)
router.delete('/:id', authenticate, checkOwnership(Blog), async (req, res) => {
  try {
    const blog = req.resource;

    // Delete related data
    await Promise.all([
      BlogTag.deleteMany({ blog_id: blog._id }),
      Comment.deleteMany({ blog_id: blog._id }),
      Rating.deleteMany({ blog_id: blog._id })
    ]);

    // Delete the blog
    await Blog.findByIdAndDelete(blog._id);

    res.json({
      success: true,
      message: 'Blog deleted successfully'
    });
  } catch (error) {
    console.error('Delete blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting blog'
    });
  }
});

// @route   POST /api/blogs/:id/like
// @desc    Like/unlike blog
// @access  Private
router.post('/:id/like', authenticate, async (req, res) => {
  try {
    const blogId = req.params.id;
    const blog = await Blog.findById(blogId);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Toggle like (simplified - in production, you'd have a separate likes collection)
    await Blog.findByIdAndUpdate(blogId, { $inc: { likes: 1 } });

    res.json({
      success: true,
      message: 'Blog liked successfully'
    });
  } catch (error) {
    console.error('Like blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error liking blog'
    });
  }
});

export default router;