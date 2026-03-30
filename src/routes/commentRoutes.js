import express from 'express';
import { createComment, deleteComment, getComments, toggleLike } from '../controllers/commentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getComments);
router.post('/', protect, createComment);
router.post('/:id/like', protect, toggleLike);
router.delete('/:id', protect, deleteComment);

export default router;
