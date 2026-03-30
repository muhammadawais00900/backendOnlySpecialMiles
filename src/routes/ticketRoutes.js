import express from 'express';
import { createTicket, getAllTickets, getMyTickets, updateTicket } from '../controllers/ticketController.js';
import { authorize, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/public', createTicket);
router.get('/my', protect, getMyTickets);
router.get('/admin', protect, authorize('admin'), getAllTickets);
router.post('/', protect, createTicket);
router.patch('/admin/:id', protect, authorize('admin'), updateTicket);

export default router;
