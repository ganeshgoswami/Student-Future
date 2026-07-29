import express from 'express';
import {
  submitAttempt,
  getAttemptResults,
  getLeaderboard,
  getMyResults,
  getMyCertificates
} from '../controllers/resultController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All result routes are protected
router.use(protect);

router.post('/attempts/:id/submit', submitAttempt);
router.get('/attempts/:id/results', getAttemptResults);
router.get('/leaderboard', getLeaderboard);
router.get('/my-results', getMyResults);
router.get('/my-certificates', getMyCertificates);

export default router;
