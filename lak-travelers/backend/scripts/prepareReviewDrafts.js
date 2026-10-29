// One-time, rerunnable preparation. Usage: node scripts/prepareReviewDrafts.js PHOTO_1 PHOTO_2
import 'dotenv/config';
import mongoose from 'mongoose';
import { readFile } from 'node:fs/promises';
import { CustomerReview, CustomerReviewImage } from '../models/CustomerReview.js';
const paths = process.argv.slice(2);
if (paths.length !== 2) throw new Error('Provide the two customer photo paths in review order.');
const photos = await Promise.all(paths.map(path => readFile(path)));
for (const data of photos) if (data.length > 5 * 1024 * 1024 || data[0] !== 255 || data[1] !== 216 || data[2] !== 255) throw new Error('Expected JPEG photos of at most 5 MB.');
try {
 await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
 for (let i = 1; i <= 4; i++) {
  const id = new mongoose.Types.ObjectId(`20261028000000000000000${i}`);
  const imageId = new mongoose.Types.ObjectId(`20261028000000000000001${i}`);
  // Never overwrite a draft the owner has edited or approved.
  if (await CustomerReview.exists({ _id: id })) { console.log(`Draft ${i}: already prepared`); continue; }
  if (i <= 2) await CustomerReviewImage.updateOne({ _id: imageId }, { $setOnInsert: { review: id, data: photos[i-1], contentType: 'image/jpeg' } }, { upsert: true });
  const review = new CustomerReview({ _id: id, name: '', comment: '', rating: 5, status: 'draft', draftLabel: `Review draft ${i}`, images: i <= 2 ? [imageId] : [] });
  await review.save();
  console.log(`Draft ${i}: saved privately with ${review.images.length} photo(s)`);
 }
 const drafts = await CustomerReview.find({ _id: { $in: [1,2,3,4].map(i => new mongoose.Types.ObjectId(`20261028000000000000000${i}`)) } }).select('status rating images');
 console.log(`Verified ${drafts.length} persisted entries; ${drafts.filter(d => d.status === 'draft').length} private drafts.`);
} finally { await mongoose.disconnect(); }
