import { Request, Response } from 'express';
import Comment, { IComment } from '../models/Comment';
import Article from '../models/Article';
import mongoose from 'mongoose';

// Helper function to validate and convert string to ObjectId
const toObjectId = (id: string | undefined): mongoose.Types.ObjectId | null => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  return new mongoose.Types.ObjectId(id);
};

export const createComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { content, author, articleId, parentCommentId } = req.body;

    // Validate required fields
    if (!content || !content.trim()) {
      res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
      return;
    }

    if (!author) {
      res.status(400).json({
        success: false,
        message: 'Author ID is required'
      });
      return;
    }

    if (!articleId) {
      res.status(400).json({
        success: false,
        message: 'Article ID is required'
      });
      return;
    }

    // Check if article exists
    const articleObjectId = toObjectId(articleId);
    if (!articleObjectId) {
      res.status(400).json({
        success: false,
        message: 'Invalid article ID'
      });
      return;
    }

    const article = await Article.findById(articleObjectId);
    if (!article) {
      res.status(404).json({
        success: false,
        message: 'Article not found'
      });
      return;
    }

    // Validate author ID
    const authorObjectId = toObjectId(author);
    if (!authorObjectId) {
      res.status(400).json({
        success: false,
        message: 'Invalid author ID'
      });
      return;
    }

    // Validate parent comment if provided
    let parentCommentObjectId = null;
    if (parentCommentId) {
      parentCommentObjectId = toObjectId(parentCommentId);
      if (!parentCommentObjectId) {
        res.status(400).json({
          success: false,
          message: 'Invalid parent comment ID'
        });
        return;
      }

      const parentComment = await Comment.findById(parentCommentObjectId);
      if (!parentComment) {
        res.status(404).json({
          success: false,
          message: 'Parent comment not found'
        });
        return;
      }
    }

    const comment: IComment = new Comment({
      content: content.trim(),
      author: authorObjectId,
      article: articleObjectId,
      parentComment: parentCommentObjectId,
      isApproved: false, // Default to false for moderation
      isSpam: false,
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip
    });

    await comment.save();

    // Populate the comment before returning
    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'name email avatar')
      .populate('article', 'title slug');

    res.status(201).json({
      success: true,
      message: 'Comment submitted successfully. It will appear after approval.',
      data: populatedComment
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  }
};

export const getCommentsByArticle = async (req: Request, res: Response): Promise<void> => {
  try {
    const { articleId } = req.params;
    const { status = 'approved', includeReplies = 'true' } = req.query;

    const articleObjectId = toObjectId(articleId);
    if (!articleObjectId) {
      res.status(400).json({
        success: false,
        message: 'Invalid article ID'
      });
      return;
    }

    // Build query based on status filter
    const query: any = { 
      article: articleObjectId
    };

    // Convert status string to boolean conditions
    if (status === 'approved') {
      query.isApproved = true;
      query.isSpam = false;
    } else if (status === 'pending') {
      query.isApproved = false;
      query.isSpam = false;
    } else if (status === 'spam') {
      query.isSpam = true;
    } else if (status === 'rejected') {
      query.isApproved = false;
      query.isSpam = false;
    }

    // If not including replies, only get top-level comments
    if (includeReplies === 'false') {
      query.parentComment = { $eq: null };
    }

    const comments = await Comment.find(query)
      .populate('author', 'name email avatar')
      .populate('article', 'title slug')
      .populate('parentComment')
      .populate('replyCount')
      .sort({ createdAt: -1 })
      .lean();

    // Structure comments as a tree (parent with children)
    const commentMap = new Map();
    const rootComments: any[] = [];

    // First pass: create a map of all comments
    comments.forEach(comment => {
      commentMap.set(comment._id.toString(), { 
        ...comment, 
        replies: [],
        status: comment.isSpam ? 'spam' : comment.isApproved ? 'approved' : 'pending'
      });
    });

    // Second pass: build the tree structure
    comments.forEach(comment => {
      const commentObj = commentMap.get(comment._id.toString());
      
      if (comment.parentComment) {
        const parent = commentMap.get(comment.parentComment.toString());
        if (parent) {
          parent.replies.push(commentObj);
        }
      } else {
        rootComments.push(commentObj);
      }
    });

    res.status(200).json({
      success: true,
      data: rootComments,
      count: rootComments.length,
      totalCount: comments.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching comments',
      error: error.message
    });
  }
};

export const getCommentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const objectId = toObjectId(req.params.id);
    
    if (!objectId) {
      res.status(400).json({
        success: false,
        message: 'Invalid comment ID'
      });
      return;
    }

    const comment = await Comment.findById(objectId)
      .populate('author', 'name email avatar')
      .populate('article', 'title slug')
      .populate('parentComment')
      .populate('replyCount');
    
    if (!comment) {
      res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: comment
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching comment',
      error: error.message
    });
  }
};

export const updateComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const objectId = toObjectId(req.params.id);
    const { content, isApproved, isSpam } = req.body;

    if (!objectId) {
      res.status(400).json({
        success: false,
        message: 'Invalid comment ID'
      });
      return;
    }

    const updateData: any = {};
    if (content !== undefined) {
      updateData.content = content.trim();
      updateData.isEdited = true;
    }
    if (isApproved !== undefined) {
      updateData.isApproved = isApproved;
    }
    if (isSpam !== undefined) {
      updateData.isSpam = isSpam;
    }

    const comment = await Comment.findByIdAndUpdate(
      objectId,
      updateData,
      { new: true, runValidators: true }
    ).populate('author', 'name email avatar')
     .populate('article', 'title slug');

    if (!comment) {
      res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      data: comment
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error updating comment',
        error: error.message
      });
    }
  }
};

export const deleteComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const objectId = toObjectId(req.params.id);

    if (!objectId) {
      res.status(400).json({
        success: false,
        message: 'Invalid comment ID'
      });
      return;
    }

    // Also delete all replies to this comment
    await Comment.deleteMany({ parentComment: objectId });

    const comment = await Comment.findByIdAndDelete(objectId);
    
    if (!comment) {
      res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Comment and its replies deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error deleting comment',
      error: error.message
    });
  }
};

export const updateCommentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const objectId = toObjectId(req.params.id);
    const { status } = req.body;

    if (!objectId) {
      res.status(400).json({
        success: false,
        message: 'Invalid comment ID'
      });
      return;
    }

    if (!status || !['approved', 'pending', 'spam', 'rejected'].includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Valid status is required'
      });
      return;
    }

    // Convert status string to boolean fields
    const updateData: any = {};
    if (status === 'approved') {
      updateData.isApproved = true;
      updateData.isSpam = false;
    } else if (status === 'pending') {
      updateData.isApproved = false;
      updateData.isSpam = false;
    } else if (status === 'spam') {
      updateData.isApproved = false;
      updateData.isSpam = true;
    } else if (status === 'rejected') {
      updateData.isApproved = false;
      updateData.isSpam = false;
    }

    const comment = await Comment.findByIdAndUpdate(
      objectId,
      updateData,
      { new: true, runValidators: true }
    ).populate('author', 'name email avatar')
     .populate('article', 'title slug');

    if (!comment) {
      res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Comment ${status} successfully`,
      data: comment
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error updating comment status',
      error: error.message
    });
  }
};

export const likeComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const objectId = toObjectId(req.params.id);

    if (!objectId) {
      res.status(400).json({
        success: false,
        message: 'Invalid comment ID'
      });
      return;
    }

    const comment = await Comment.findByIdAndUpdate(
      objectId,
      { $inc: { likes: 1 } },
      { new: true }
    ).populate('author', 'name email avatar')
     .populate('article', 'title slug');

    if (!comment) {
      res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Comment liked successfully',
      data: comment
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error liking comment',
      error: error.message
    });
  }
};

export const dislikeComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const objectId = toObjectId(req.params.id);

    if (!objectId) {
      res.status(400).json({
        success: false,
        message: 'Invalid comment ID'
      });
      return;
    }

    const comment = await Comment.findByIdAndUpdate(
      objectId,
      { $inc: { dislikes: 1 } },
      { new: true }
    ).populate('author', 'name email avatar')
     .populate('article', 'title slug');

    if (!comment) {
      res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Comment disliked successfully',
      data: comment
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error disliking comment',
      error: error.message
    });
  }
};

export const getCommentStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const stats = await Comment.aggregate([
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$isSpam', true] },
              'spam',
              {
                $cond: [
                  { $eq: ['$isApproved', true] },
                  'approved',
                  'pending'
                ]
              }
            ]
          },
          count: { $sum: 1 }
        }
      }
    ]);

    const totalComments = await Comment.countDocuments();
    
    const statsObject = {
      totalComments,
      approved: 0,
      pending: 0,
      spam: 0,
      rejected: 0
    };

    stats.forEach(stat => {
      statsObject[stat._id as keyof typeof statsObject] = stat.count;
    });

    res.status(200).json({
      success: true,
      data: statsObject
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching comment stats',
      error: error.message
    });
  }
};

export const getAllComments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, page = 1, limit = 50, search } = req.query;

    // Build query
    const query: any = {};

    // Convert status string to boolean conditions
    if (status === 'approved') {
      query.isApproved = true;
      query.isSpam = false;
    } else if (status === 'pending') {
      query.isApproved = false;
      query.isSpam = false;
    } else if (status === 'spam') {
      query.isSpam = true;
    } else if (status === 'rejected') {
      query.isApproved = false;
      query.isSpam = false;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { content: { $regex: search, $options: 'i' } },
        { 'author.name': { $regex: search, $options: 'i' } },
        { 'author.email': { $regex: search, $options: 'i' } },
        { 'article.title': { $regex: search, $options: 'i' } }
      ];
    }

    const comments = await Comment.find(query)
      .populate('author', 'name email avatar')
      .populate('article', 'title slug')
      .populate('parentComment')
      .populate('replyCount')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean();

    const total = await Comment.countDocuments(query);

    res.status(200).json({
      success: true,
      data: comments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching comments',
      error: error.message
    });
  }
};