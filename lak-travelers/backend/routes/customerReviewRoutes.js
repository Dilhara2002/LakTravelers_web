import express from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import { CustomerReview, CustomerReviewImage } from '../models/CustomerReview.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { createRateLimiter } from '../middleware/rateLimitMiddleware.js';
import { notifyReview } from '../utils/reviewNotification.js';
const router = express.Router();
router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
const fail = (message) => Object.assign(new Error(message), { statusCode: 400 });
const upload = multer({ storage: multer.memoryStorage(), limits: { files: 5, fileSize: 5 * 1024 * 1024, fields: 4, fieldSize: 8000, parts: 9 }, fileFilter(_req, file, cb) {
 cb(['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype) ? null : fail('Only JPG, PNG and WebP images are supported.'), true);
} }).array('photos', 5);
export function imageType(buffer) {
 if (buffer.length > 3 && buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) return 'image/jpeg';
 if (buffer.length > 8 && buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'image/png';
 if (buffer.length > 12 && buffer.toString('ascii',0,4) === 'RIFF' && buffer.toString('ascii',8,12) === 'WEBP') return 'image/webp';
 return null;
}
export function validateReview(body, files) {
 const { name, comment, rating, website } = body;
 if (website) throw fail('Unable to submit this review.');
 if (typeof name !== 'string' || !name.trim() || name.trim().length > 80) throw fail('Name is required (up to 80 characters).');
 if (typeof comment !== 'string' || comment.trim().length < 10 || comment.trim().length > 2000) throw fail('Review must contain 10–2000 characters.');
 if (!/^[1-5]$/.test(String(rating))) throw fail('Select a rating from 1 to 5.');
 if (/[<>]/.test(name + comment)) throw fail('Please use plain text without HTML.');
 if (files.length > 5 || files.some(f => f.size > 5 * 1024 * 1024 || !imageType(f.buffer) || imageType(f.buffer) !== f.mimetype)) throw fail('Use up to 5 JPG, PNG or WebP images, maximum 5 MB each.');
 return { name: name.trim(), comment: comment.trim(), rating: Number(rating) };
}
const publicFields = 'name rating comment images createdAt';
router.get('/', async (_req, res) => res.json(await CustomerReview.find({ status: 'approved' }).select(publicFields).sort({ createdAt: -1 }).limit(100).lean()));
router.get('/moderation', protect, admin, async (_req, res) => res.json(await CustomerReview.find({ status: { $in: ['draft', 'pending'] } }).select(`${publicFields} status draftLabel updatedAt notification decisionAt`).sort({ createdAt: 1 }).limit(100).lean()));
router.patch('/:id/details', protect, admin, async (req, res) => {
 const review = await CustomerReview.findById(req.params.id);
 if (!review) return res.status(404).json({ message: 'Review not found.' });
 if (!['draft', 'pending'].includes(review.status)) throw fail('Only unpublished reviews can be edited.');
 const { name, comment, rating } = req.body;
 if (typeof name !== 'string' || name.trim().length > 80 || typeof comment !== 'string' || comment.trim().length > 2000 || /[<>]/.test(name + comment) || !/^[1-5]$/.test(String(rating))) throw fail('Use plain text, a name up to 80 characters, a review up to 2000 characters and a rating from 1–5.');
 if (review.status !== 'draft') validateReview({ name, comment, rating }, []);
 Object.assign(review, { name: name.trim(), comment: comment.trim(), rating: Number(rating) });
 await review.save();
 res.json({ _id: review._id, name: review.name, comment: review.comment, rating: review.rating, status: review.status });
});
router.get('/moderation/:id', protect, admin, async (req, res) => {
 const review = await CustomerReview.findById(req.params.id).select(`${publicFields} status draftLabel updatedAt notification decisionAt`);
 if (!review) return res.status(404).json({ message: 'Review not found.' });
 res.json(review);
});
async function decide(req, res) {
 if (!['approved', 'rejected'].includes(req.body.status)) throw fail('Invalid moderation status.');
 const existing = await CustomerReview.findById(req.params.id).select('name comment rating status updatedAt');
 if (!existing) return res.status(404).json({ message: 'Review not found.' });
 if (!['draft', 'pending'].includes(existing.status)) return res.status(409).json({ message: 'This review has already been processed.' });
 if (req.body.status === 'approved') validateReview(existing, []);
 // Compare-and-set makes simultaneous or repeated decisions safe, including edits during confirmation.
 const review = await CustomerReview.findOneAndUpdate({ _id: existing._id, status: existing.status, updatedAt: existing.updatedAt }, { $set: { status: req.body.status, decisionAt: new Date() } }, { new: true, runValidators: true }).select(publicFields);
 if (!review) return res.status(409).json({ message: 'Review changed or was already processed. Reload before deciding.' });
 res.json({ ...review.toObject(), message: `Review ${req.body.status}.` });
}
router.post('/:id/decision', protect, admin, decide);
// Retain the old admin API for existing clients; both paths enforce identical authorization and replay checks.
router.patch('/:id/status', protect, admin, decide);
router.post('/:id/notify', protect, admin, createRateLimiter({ windowMs: 60 * 60 * 1000, max: 20, message: 'Notification retry limit reached.' }), async (req, res) => {
 const review = await CustomerReview.findById(req.params.id);
 if (!review) return res.status(404).json({ message: 'Review not found.' });
 if (review.status !== 'pending') throw fail('Only pending customer reviews need email notifications.');
 const result = await notifyReview(review);
 res.status(result.status === 'sent' ? 200 : 503).json({ message: result.status === 'sent' ? 'Notification sent.' : 'Notification failed. Check the configured email service and retry.', notification: result });
});
async function photo(req, res) {
 if (!mongoose.isValidObjectId(req.params.id)) return res.sendStatus(404);
 const image = await CustomerReviewImage.findById(req.params.id);
 if (!image) return res.sendStatus(404);
 const review = await CustomerReview.findById(image.review).select('status');
 if (!review || (!req.user && review.status !== 'approved')) return res.sendStatus(404);
 res.set({ 'Content-Type': image.contentType, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, no-store', 'Content-Security-Policy': "default-src 'none'; sandbox" }).send(image.data);
}
router.get('/photos/:id', photo);
router.get('/moderation/photos/:id', protect, admin, photo);
router.post('/', createRateLimiter({ windowMs: 60 * 60 * 1000, max: 5, message: 'Please wait before submitting another review.' }), (req, res, next) => upload(req, res, err => next(err ? fail(err.message) : undefined)), async (req, res) => {
 const fields = validateReview(req.body, req.files || []);
 const review = new CustomerReview(fields);
 try {
  for (const file of req.files || []) {
   const image = await CustomerReviewImage.create({ review: review._id, data: file.buffer, contentType: imageType(file.buffer) });
   review.images.push(image._id);
  }
  await review.save();
 } catch (err) {
  await CustomerReviewImage.deleteMany({ review: review._id });
  throw err;
 }
 await notifyReview(review);
 res.status(201).json({ message: 'Thank you! Your review has been submitted for approval.' });
});
export default router;
