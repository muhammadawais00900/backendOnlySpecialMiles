import express from 'express';
import {
  createProgram,
  deleteProgram,
  enrolInProgram,
  getMyEnrolments,
  getProgramById,
  getPrograms,
  updateEnrolmentProgress,
  updateProgram
} from '../controllers/programController.js';
import { authorize, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getPrograms);
router.get('/enrolments/my', protect, getMyEnrolments);
router.get('/:id', getProgramById);
router.post('/:id/enroll', protect, enrolInProgram);
router.patch('/enrolments/:id/progress', protect, updateEnrolmentProgress);

router.post('/admin/create', protect, authorize('admin'), createProgram);
router.put('/admin/:id', protect, authorize('admin'), updateProgram);
router.delete('/admin/:id', protect, authorize('admin'), deleteProgram);

export default router;
