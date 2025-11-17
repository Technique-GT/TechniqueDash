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

    if (!author || !author.name || !author.email) {
      res.status(400).json({
        success: false,
        message: 'Author name and email are required'
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
    const article = await Article.findById(articleId);
    if (!article) {
      res.status(404).json({
        success: false,
        message: 'Article not found'
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
      author: {
        name: author.name.trim(),
        email: author.email.toLowerCase().trim(),
        avatar: author.avatar || ''
      },
      article: new mongoose.Types.ObjectId(articleId),
      parentComment: parentCommentObjectId,
      status: 'pending', // Default to pending for moderation
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip
    });

    await comment.save();

    // Populate the comment before returning
    const populatedComment = await Comment.findById(comment._id);

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

    // Build query
    const query: any = { 
      article: articleObjectId,
      status: status as string
    };

    // If not including replies, only get top-level comments
    if (includeReplies === 'false') {
      query.parentComment = { $eq: null };
    }

    const comments = await Comment.find(query)
      .populate('replyCount')
      .sort({ createdAt: -1 })
      .lean();

    // Structure comments as a tree (parent with children)
    const commentMap = new Map();
    const rootComments: any[] = [];

    // First pass: create a map of all comments
    comments.forEach(comment => {
      commentMap.set(comment._id.toString(), { ...comment, replies: [] });
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
    const { content, status } = req.body;

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
    if (status !== undefined) {
      updateData.status = status;
    }

    const comment = await Comment.findByIdAndUpdate(
      objectId,
      updateData,
      { new: true, runValidators: true }
    );

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

    const comment = await Comment.findByIdAndUpdate(
      objectId,
      { status },
      { new: true, runValidators: true }
    );

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
    );

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
    );

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
          _id: '$status',
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