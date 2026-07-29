import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/studentfuture';

export async function connectDB() {
  try {
    const conn = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000 // Time out after 5 seconds
    });
    console.log(`=================================================`);
    console.log(`MongoDB Connected successfully to: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.name}`);
    console.log(`=================================================`);
  } catch (err) {
    console.error(`❌ MongoDB Connection Error: ${err.message}`);
    console.log(`Please check if your MongoDB server is running or MONGO_URI is correct.`);
    // Exit process with failure
    process.exit(1);
  }
}
