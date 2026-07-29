import express from 'express';
import {
  getQuestions,
  createQuestion,
  bulkImportQuestions,
  deleteQuestion
} from '../controllers/questionController.js';
import { protect, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// All question routes are protected
router.use(protect);

// Student/Admin: View questions pool
router.get('/', getQuestions);

// Admin only operations
router.post('/', authorizeRoles('admin', 'superadmin'), createQuestion);
router.post('/bulk', authorizeRoles('admin', 'superadmin'), bulkImportQuestions);
router.delete('/:id', authorizeRoles('admin', 'superadmin'), deleteQuestion);

export default router;
