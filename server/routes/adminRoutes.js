import express from 'express';
import {
  getDashboardMetrics,
  getStudentsList,
  toggleStudentStatus
} from '../controllers/adminController.js';
import { protect, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// All administrative routes require JWT auth and admin/superadmin roles
router.use(protect);
router.use(authorizeRoles('admin', 'superadmin'));

router.get('/metrics', getDashboardMetrics);
router.get('/students', getStudentsList);
router.post('/students/:id/toggle-status', toggleStudentStatus);

export default router;
