import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();

// Configure Cloudinary if credentials exist
const isCloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log("Cloudinary Storage service initialized.");
} else {
  console.log("Cloudinary credentials missing in .env. Falling back to local filesystem storage.");
}

/**
 * Uploads a file to Cloudinary or saves it locally if Cloudinary is not configured.
 * @param {Object} file - The file object from multer
 * @param {String} folder - Sub-folder name (e.g., 'profile_photos')
 * @returns {Promise<String>} - URL of the uploaded image
 */
export async function uploadImage(file, folder = 'temp') {
  if (!file) return '';

  if (isCloudinaryConfigured) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: `student_future/${folder}`
      });
      // Delete temporary local file
      await fs.unlink(file.path).catch(err => console.error("Temp file delete failed:", err));
      return result.secure_url;
    } catch (err) {
      console.error("Cloudinary upload failed, falling back to local file path:", err);
      // Fall through to local save if Cloudinary fails
    }
  }

  // Local filesystem fallback: move file from multer temp to permanent server/uploads directory
  try {
    const uploadDir = path.join(process.cwd(), 'uploads', folder);
    await fs.mkdir(uploadDir, { recursive: true });
    
    const ext = path.extname(file.originalname);
    const newFilename = `${file.filename || Date.now()}${ext}`;
    const destinationPath = path.join(uploadDir, newFilename);
    
    await fs.rename(file.path, destinationPath);
    
    // Return relative URL serving path
    return `/uploads/${folder}/${newFilename}`;
  } catch (err) {
    console.error("Local file save failed:", err);
    throw new Error("Failed to upload image file.");
  }
}
