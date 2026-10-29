import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { protect, vendor } from '../middleware/authMiddleware.js';
import { uploadLimiter } from '../middleware/rateLimitMiddleware.js';

dotenv.config();

const router = express.Router();

// 1. Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    callback(allowed.includes(file.mimetype) ? null : new Error('Only JPEG, PNG, and WebP images are allowed'), allowed.includes(file.mimetype));
  },
});

// 4. POST route to handle image uploads
// Access this via: POST /api/upload
router.post('/', protect, vendor, uploadLimiter, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({
        folder: 'lak-travelers-uploads',
        resource_type: 'image',
        transformation: [{ width: 1600, height: 1600, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
      }, (error, uploaded) => error ? reject(error) : resolve(uploaded));
      stream.end(req.file.buffer);
    });

    res.status(200).json({
      message: 'Image uploaded successfully ✅',
      image: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

export default router;
