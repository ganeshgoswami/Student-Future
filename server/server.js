import app from './app.js';
import { connectDB } from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

async function startServer() {
  // Connect to Database
  await connectDB();

  // Listen
  app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(`StudentFuture MERN API server listening on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`API URL: http://localhost:${PORT}`);
    console.log(`=================================================`);
  });
}

startServer().catch(err => {
  console.error("❌ Failed to start MERN Server:", err);
});
