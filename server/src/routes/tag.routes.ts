import express from 'express';
import {
  createTag,
  getTags,
  getTagById,
  getTagBySlug,
  updateTag,
  deleteTag,
  hardDeleteTag,
  bulkDeleteTags,
  getTagStats
} from '../controllers/tag.controller';

const router = express.Router();

router.post('/', createTag);
router.get('/', getTags);
router.get('/stats', getTagStats);
router.get('/:id', getTagById);
router.get('/slug/:slug', getTagBySlug);
router.put('/:id', updateTag);
router.patch('/:id', updateTag);
router.delete('/:id', deleteTag);
router.delete('/:id/hard', hardDeleteTag);
router.post('/bulk-delete', bulkDeleteTags);

export default router;