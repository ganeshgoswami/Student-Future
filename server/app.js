import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

// Import Route modules
import authRoutes from './routes/authRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import testRoutes from './routes/testRoutes.js';
import attemptRoutes from './routes/attemptRoutes.js';
import resultRoutes from './routes/resultRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false // Allow loading static image uploads across origins
}));
app.use(cors());

// Logging
app.use(morgan('dev'));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per window
  message: { error: 'Too many requests from this IP, please try again later.' }
});
app.use('/api/', limiter);

// Serve uploads folder as static route
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Serve frontend if built/placed, or serve API status
app.get('/api/status', (req, res) => {
  res.json({ status: 'Online', service: 'StudentFuture examination API system', version: '1.0.0' });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/admin', adminRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Server Error:", err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error. Please contact administrator.'
  });
});

export default app;
