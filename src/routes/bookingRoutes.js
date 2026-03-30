import express from 'express';
import {
  createBooking,
  getAllBookings,
  getMyBookings,
  updateBooking
} from '../controllers/bookingController.js';
import { authorize, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/my', protect, getMyBookings);
router.post('/', protect, createBooking);

router.get('/admin', protect, authorize('admin'), getAllBookings);
router.patch('/admin/:id', protect, authorize('admin'), updateBooking);

export default router;
