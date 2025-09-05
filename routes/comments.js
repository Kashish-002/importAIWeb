import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { Comment, Rating, Blog, User } from '../models';
import { authenticate, authorize, optionalAuth } from '../middleware/auth';
import { sanitizeContent, rateLimits } from '../middleware/security';

const router = express.Router();

// Validation rules
const createCommentValidation = [
  body('blog_id')
    .isMongoId()
    .withMessage('Invalid blog ID'),
  body('text')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1 and 1000 characters'),
  body('parent_id')
    .optional()
    .isMongoId()
    .withMessage('Invalid parent comment ID')
];

const createRatingValidation = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5')
];

// @route   GET /api/comments
// @desc    Get comments for a blog
// @access  Public
router.get('/', [
  query('blogId')
    .isMongoId()
    .withMessage('Invalid blog ID'),
  query('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected'])
    .withMessage('Invalid status'),
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

    const {
      blogId,
      status = 'approved',
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    const query = { blog_id: blogId };
    
    // Only show approved comments for non-admin users
    if (!req.user || req.user.role !== 'Admin') {
      query.status = 'approved';
    } else if (status) {
      query.status = status;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const [comments, total] = await Promise.all([
      Comment.find(query)
        .populate('user_id', 'name avatar')
        .populate('parent_id', 'text user_id')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Comment.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: comments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching comments'
    });
  }
});

// @route   POST /api/comments
// @desc    Create a new comment
// @access  Private
router.post('/', authenticate, rateLimits.comments, sanitizeContent, createCommentValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { blog_id, text, parent_id } = req.body;

    // Check if blog exists
    const blog = await Blog.findById(blog_id);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Check if parent comment exists (for replies)
    if (parent_id) {
      const parentComment = await Comment.findById(parent_id);
      if (!parentComment || parentComment.blog_id.toString() !== blog_id) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found'
        });
      }
    }

    // Create comment
    const comment = new Comment({
      blog_id,
      user_id: req.user._id,
      text,
      parent_id: parent_id || null,
      status: 'pending' // Comments require approval by default
    });

    await comment.save();

    // Populate the created comment
    const populatedComment = await Comment.findById(comment._id)
      .populate('user_id', 'name avatar')
      .lean();

    res.status(201).json({
      success: true,
      message: 'Comment submitted for review',
      data: populatedComment
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating comment'
    });
  }
});

// @route   PUT /api/comments/:id/status
// @desc    Update comment status (approve/reject)
// @access  Private (Admin only)
router.put('/:id/status', authenticate, authorize('Admin'), [
  param('id')
    .isMongoId()
    .withMessage('Invalid comment ID'),
  body('status')
    .isIn(['approved', 'rejected'])
    .withMessage('Status must be approved or rejected')
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
    const { status } = req.body;

    const comment = await Comment.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('user_id', 'name avatar');

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    res.json({
      success: true,
      message: `Comment ${status} successfully`,
      data: comment
    });
  } catch (error) {
    console.error('Update comment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating comment status'
    });
  }
});

// @route   DELETE /api/comments/:id
// @desc    Delete comment
// @access  Private (Admin or Comment Author)
router.delete('/:id', authenticate, [
  param('id')
    .isMongoId()
    .withMessage('Invalid comment ID')
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
    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user can delete this comment
    if (req.user.role !== 'Admin' && comment.user_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own comments'
      });
    }

    // Delete comment and its replies
    await Comment.deleteMany({
      $or: [
        { _id: id },
        { parent_id: id }
      ]
    });

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting comment'
    });
  }
});

// @route   POST /api/comments/:id/like
// @desc    Like/unlike a comment
// @access  Private
router.post('/:id/like', authenticate, [
  param('id')
    .isMongoId()
    .withMessage('Invalid comment ID')
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
    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Increment like count (simplified - in production, track individual likes)
    await Comment.findByIdAndUpdate(id, { $inc: { likes: 1 } });

    res.json({
      success: true,
      message: 'Comment liked successfully'
    });
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error liking comment'
    });
  }
});

// @route   POST /api/ratings
// @desc    Rate a blog
// @access  Private
router.post('/', authenticate, createRatingValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { blog_id, rating } = req.body;

    // Check if blog exists
    const blog = await Blog.findById(blog_id);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Check if user has already rated this blog
    const existingRating = await Rating.findOne({
      blog_id,
      user_id: req.user._id
    });

    if (existingRating) {
      // Update existing rating
      existingRating.rating_value = rating;
      await existingRating.save();
      
      res.json({
        success: true,
        message: 'Rating updated successfully',
        data: existingRating
      });
    } else {
      // Create new rating
      const newRating = new Rating({
        blog_id,
        user_id: req.user._id,
        rating_value: rating
      });

      await newRating.save();

      res.status(201).json({
        success: true,
        message: 'Rating submitted successfully',
        data: newRating
      });
    }
  } catch (error) {
    console.error('Rate blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error rating blog'
    });
  }
});

// @route   GET /api/ratings/:blogId
// @desc    Get ratings for a blog
// @access  Public
router.get('/:blogId', [
  param('blogId')
    .isMongoId()
    .withMessage('Invalid blog ID')
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

    const { blogId } = req.params;

    // Get rating statistics
    const ratingStats = await Rating.aggregate([
      { $match: { blog_id: blogId } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating_value' },
          totalRatings: { $sum: 1 },
          ratingBreakdown: {
            $push: {
              rating: '$rating_value',
              user: '$user_id',
              createdAt: '$createdAt'
            }
          }
        }
      }
    ]);

    // Get rating distribution
    const ratingDistribution = await Rating.aggregate([
      { $match: { blog_id: blogId } },
      {
        $group: {
          _id: '$rating_value',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    const stats = ratingStats.length > 0 ? ratingStats[0] : {
      averageRating: 0,
      totalRatings: 0,
      ratingBreakdown: []
    };

    res.json({
      success: true,
      data: {
        ...stats,
        distribution: ratingDistribution
      }
    });
  } catch (error) {
    console.error('Get ratings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching ratings'
    });
  }
});

export default router;