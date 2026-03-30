import express from 'express';
import { getAdminOverview, getDashboardOverview } from '../controllers/dashboardController.js';
import { authorize, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/overview', protect, getDashboardOverview);
router.get('/admin', protect, authorize('admin'), getAdminOverview);

export default router;
