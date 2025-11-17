import express from 'express';
import {
  createSubCategory,
  getSubCategories,
  getSubCategoryById,
  getSubCategoryBySlug,
  updateSubCategory,
  deleteSubCategory,
  hardDeleteSubCategory,
  getSubCategoriesByCategory,
  getSubCategoryStats
} from '../controllers/subCategory.controller';

const router = express.Router();

// Public routes
router.get('/stats', getSubCategoryStats);

router.get('/', getSubCategories);
router.get('/category/:categoryId', getSubCategoriesByCategory);
router.get('/slug/:slug', getSubCategoryBySlug);
router.get('/:id', getSubCategoryById);

// Protected routes (add authentication middleware as needed)
router.post('/', createSubCategory);
router.put('/:id', updateSubCategory);
router.delete('/:id', deleteSubCategory);
router.delete('/:id/hard', hardDeleteSubCategory);

export default router;