import express from 'express';
import {
  createComment,
  getCommentsByArticle,
  getCommentById,
  updateComment,
  deleteComment,
  updateCommentStatus,
  likeComment,
  dislikeComment,
  getCommentStats,
  getAllComments // Add this import
} from '../controllers/comment.controller';

const router = express.Router();

// Public routes
router.post('/', createComment);
router.get('/article/:articleId', getCommentsByArticle);
router.patch('/:id/like', likeComment);
router.patch('/:id/dislike', dislikeComment);

// Admin routes
router.get('/', getAllComments); // Add this line - GET all comments
router.get('/stats', getCommentStats);
router.get('/:id', getCommentById);
router.put('/:id', updateComment);
router.delete('/:id', deleteComment);
router.patch('/:id/status', updateCommentStatus);

export default router;