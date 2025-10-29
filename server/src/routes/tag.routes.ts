import express from 'express';
import {
  createTag,
  getTags,
  getTagById,
  updateTag,
  deleteTag,
  bulkDeleteTags
} from '../controllers/tag.controller';

const router = express.Router();

router.post('/', createTag);
router.get('/', getTags);
router.get('/:id', getTagById);
router.put('/:id', updateTag);
router.delete('/:id', deleteTag);
router.post('/bulk-delete', bulkDeleteTags);

export default router;