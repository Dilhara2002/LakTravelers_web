import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  caption: { type: String, required: true, trim: true, maxlength: 160 },
  published: { type: Boolean, default: false, index: true },
  // Each image is capped at 5 MB, safely below MongoDB's document limit.
  data: { type: Buffer, required: true, select: false },
  contentType: { type: String, required: true },
}, { timestamps: true });
export default mongoose.model('GalleryPhoto', schema);
