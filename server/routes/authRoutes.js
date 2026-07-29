import express from 'express';
import multer from 'multer';
import os from 'os';
import {
  registerStudent,
  loginUser,
  forgotPassword,
  resetPassword,
  getProfile
} from '../controllers/authController.js';
import {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword
} from '../validators/authValidator.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Multer temporary file storage handler
const upload = multer({ dest: os.tmpdir() });

// Public Auth Endpoints
router.post('/register', upload.single('profilePhoto'), validateRegister, registerStudent);
router.post('/login', validateLogin, loginUser);
router.post('/forgot-password', validateForgotPassword, forgotPassword);
router.post('/reset-password', validateResetPassword, resetPassword);

// Protected Auth Endpoints
router.get('/profile', protect, getProfile);

export default router;
