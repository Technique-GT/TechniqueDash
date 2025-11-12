import express from 'express';
import {
  createCategory,
  getCategories,
  getCategoryById,
  getCategoryBySlug,
  updateCategory,
  deleteCategory,
  hardDeleteCategory,
  getCategoryStats
} from '../controllers/category.controller';

const router = express.Router();

router.post('/', createCategory);
router.get('/', getCategories);
router.get('/stats', getCategoryStats);
router.get('/:id', getCategoryById);
router.get('/slug/:slug', getCategoryBySlug);
router.put('/:id', updateCategory);
router.patch('/:id', updateCategory);
router.delete('/:id', deleteCategory);
router.delete('/:id/hard', hardDeleteCategory);

export default router;