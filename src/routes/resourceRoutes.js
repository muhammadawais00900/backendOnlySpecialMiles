import express from 'express';
import {
  createResource,
  deleteResource,
  getResourceById,
  getResources,
  updateResource
} from '../controllers/resourceController.js';
import { authorize, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getResources);
router.get('/:id', getResourceById);

router.post('/admin/create', protect, authorize('admin'), createResource);
router.put('/admin/:id', protect, authorize('admin'), updateResource);
router.delete('/admin/:id', protect, authorize('admin'), deleteResource);

export default router;
