import { Router } from 'express';
import {
  createArticle,
  getArticles,
  getArticleById,
  getArticleBySlug,
  updateArticle,
  deleteArticle,
  getPublishedArticles,
  getFeaturedArticles,
  getStickyArticles,
  getArticlesByCategory,
  toggleFeatured,
  toggleSticky,
  updateArticleStatus
} from '../controllers/article.controller';

const router = Router();

// Create a new article
router.post('/', createArticle);

// Get all articles (admin view - includes drafts)
router.get('/', getArticles);

// Get published articles (public view)
router.get('/published', getPublishedArticles);

// Get featured articles
router.get('/featured', getFeaturedArticles);

// Get sticky articles
router.get('/sticky', getStickyArticles);

// Get articles by category
router.get('/category/:category', getArticlesByCategory);

// Get article by ID
router.get('/:id', getArticleById);

// Get article by slug
router.get('/slug/:slug', getArticleBySlug);

// Update article
router.put('/:id', updateArticle);

// Toggle featured status
router.patch('/:id/featured', toggleFeatured);

// Toggle sticky status
router.patch('/:id/sticky', toggleSticky);

// Delete article
router.delete('/:id', deleteArticle);

router.patch('/:id/status', updateArticleStatus);
export default router;