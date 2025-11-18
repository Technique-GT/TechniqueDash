import express from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  inviteUser,
  bulkDeleteUsers,
} from '../controllers/user.controller';

const router = express.Router();

// GET routes
router.get('/', getUsers);
router.get('/:id', getUserById);

// POST routes
router.post('/', createUser);
router.post('/invite', inviteUser);
router.post('/bulk-delete', bulkDeleteUsers);

// PUT/PATCH routes
router.put('/:id', updateUser);
router.patch('/:id', updateUser);

// DELETE routes
router.delete('/:id', deleteUser);

export default router;