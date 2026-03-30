import express from 'express';
import { getPublicSiteContent, updateSiteContent } from '../controllers/siteController.js';
import { authorize, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/public', getPublicSiteContent);
router.put('/admin', protect, authorize('admin'), updateSiteContent);

export default router;
