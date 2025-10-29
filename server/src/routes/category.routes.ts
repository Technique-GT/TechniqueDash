import express from 'express';
import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getCategoryStats
} from '../controllers/category.controller';

const router = express.Router();

router.post('/', createCategory);
router.get('/', getCategories);
router.get('/stats', getCategoryStats);
router.get('/:id', getCategoryById);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router;