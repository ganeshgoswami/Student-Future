import express from 'express';
import {
  getTests,
  getTestById,
  createTest
} from '../controllers/testController.js';
import { protect, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Protect all routes
router.use(protect);

router.get('/', getTests);
router.get('/:id', getTestById);

// Admin only: create a test template
router.post('/', authorizeRoles('admin', 'superadmin'), createTest);

export default router;
