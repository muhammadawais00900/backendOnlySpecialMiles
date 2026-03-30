import express from 'express';
import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getMyNotifications);
router.patch('/mark-all-read', protect, markAllNotificationsRead);
router.patch('/:id/read', protect, markNotificationRead);

export default router;
