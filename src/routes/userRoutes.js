import express from 'express';
import { listDirectory, listUsers, updateProfile, updateUserByAdmin } from '../controllers/userController.js';
import { authorize, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.put('/profile', protect, updateProfile);
router.get('/directory', protect, listDirectory);
router.get('/admin', protect, authorize('admin'), listUsers);
router.patch('/admin/:id', protect, authorize('admin'), updateUserByAdmin);

export default router;
