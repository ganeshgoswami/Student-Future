import express from 'express';
import {
  startAttempt,
  getAttempt,
  saveAnswer
} from '../controllers/attemptController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All attempt routes are protected
router.use(protect);

router.post('/start', startAttempt);
router.get('/:id', getAttempt);
router.post('/:id/save-answer', saveAnswer);

export default router;
