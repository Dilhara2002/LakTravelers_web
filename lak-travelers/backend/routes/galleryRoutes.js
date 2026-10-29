import express from 'express';
import multer from 'multer';
import GalleryPhoto from '../models/GalleryPhoto.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { uploadLimiter } from '../middleware/rateLimitMiddleware.js';
import { imageType } from './customerReviewRoutes.js';

const router = express.Router();
const invalid = message => Object.assign(new Error(message), { statusCode: 400 });
const upload = multer({ storage: multer.memoryStorage(), limits: { files: 1, fileSize: 5 * 1024 * 1024, fields: 1, fieldSize: 1000, parts: 2 } }).single('photo');
export function galleryCaption(value) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > 160 || /[<>]/.test(value)) throw invalid('Enter a plain-text caption of 1–160 characters.');
  return value.trim();
}
router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
router.get('/', async (_req, res) => res.json(await GalleryPhoto.find({ published: true }).sort({ createdAt: -1 }).limit(200).lean()));
router.get('/admin', protect, admin, async (_req, res) => res.json(await GalleryPhoto.find({}).sort({ createdAt: -1 }).limit(200).lean()));
async function photo(req, res) {
  const image = await GalleryPhoto.findOne({ _id: req.params.id, ...(!req.user ? { published: true } : {}) }).select('+data');
  if (!image) return res.sendStatus(404);
  res.set({ 'Content-Type': image.contentType, 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; sandbox" }).send(image.data);
}
router.get('/photos/:id', photo);
router.get('/admin/photos/:id', protect, admin, photo);
router.post('/', protect, admin, uploadLimiter, (req, res, next) => upload(req, res, error => next(error ? invalid(error.message) : undefined)), async (req, res) => {
  const caption = galleryCaption(req.body.caption);
  const contentType = req.file && imageType(req.file.buffer);
  if (!contentType || contentType !== req.file.mimetype) throw invalid('Choose a JPG, PNG or WebP photo, maximum 5 MB.');
  const image = await GalleryPhoto.create({ caption, contentType, data: req.file.buffer });
  res.status(201).json({ _id: image._id, caption: image.caption, published: false, createdAt: image.createdAt });
});
router.patch('/:id', protect, admin, async (req, res) => {
  const updates = {};
  if (req.body.caption !== undefined) updates.caption = galleryCaption(req.body.caption);
  if (req.body.published !== undefined) {
    if (typeof req.body.published !== 'boolean') throw invalid('Published must be true or false.');
    updates.published = req.body.published;
  }
  if (!Object.keys(updates).length) throw invalid('No changes supplied.');
  const image = await GalleryPhoto.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true, runValidators: true });
  if (!image) return res.sendStatus(404);
  res.json(image);
});
router.delete('/:id', protect, admin, async (req, res) => {
  const image = await GalleryPhoto.findByIdAndDelete(req.params.id);
  if (!image) return res.sendStatus(404);
  res.sendStatus(204);
});
export default router;
