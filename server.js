import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Import Controllers
import {
  getStudents,
  getTests,
  getQuestions,
  startAttempt,
  getAttempt,
  saveAnswer,
  submitAttempt,
  getAttemptResults,
  getDashboardStats,
  createQuestion
} from './src/controllers/testController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Serve Static Files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// ================= API ENDPOINTS =================
app.get('/api/students', getStudents);
app.get('/api/tests', getTests);
app.get('/api/questions', getQuestions);
app.post('/api/attempts/start', startAttempt);
app.get('/api/attempts/:id', getAttempt);
app.post('/api/attempts/:id/save-answer', saveAnswer);
app.post('/api/attempts/:id/submit', submitAttempt);
app.get('/api/attempts/:id/results', getAttemptResults);
app.get('/api/dashboard/stats', getDashboardStats);
app.post('/api/questions', createQuestion);

// Fallback to index.html for single-page routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Boot Server
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`StudentFuture Exam Server listening on port ${PORT}`);
  console.log(`URL: http://localhost:${PORT}`);
  console.log(`=================================================`);
});
