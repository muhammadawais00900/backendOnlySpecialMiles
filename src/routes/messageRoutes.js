import express from 'express';
import {
  getConversationSummaries,
  getMessages,
  markMessageRead,
  sendMessage
} from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getMessages);
router.get('/threads', protect, getConversationSummaries);
router.post('/', protect, sendMessage);
router.patch('/:id/read', protect, markMessageRead);

export default router;
