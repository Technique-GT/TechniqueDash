import { Router } from 'express';
import {
  createArticle,
  getArticles,
  getArticleById,
  getArticleBySlug,
  updateArticle,
  deleteArticle,
  getPublishedArticles,
  getArticlesByCategory
} from '../controllers/article.controller';

const router = Router();

// Create a new article
router.post('/', createArticle);

// Get all articles (admin view - includes drafts)
router.get('/', getArticles);

// Get published articles (public view)
router.get('/published', getPublishedArticles);

// Get articles by category
router.get('/category/:category', getArticlesByCategory);

// Get article by ID
router.get('/:id', getArticleById);

// Get article by slug
router.get('/slug/:slug', getArticleBySlug);

// Update article
router.put('/:id', updateArticle);

// Delete article
router.delete('/:id', deleteArticle);

export default router;