import mongoose from 'mongoose';
const schema = new mongoose.Schema({
 name: { type: String, default: '', required() { return this.status !== 'draft'; }, maxlength: 80 },
 rating: { type: Number, required: true, min: 1, max: 5, validate: Number.isInteger },
 comment: { type: String, default: '', required() { return this.status !== 'draft'; }, maxlength: 2000, validate: { validator(value) { return this.status === 'draft' || value.trim().length >= 10; }, message: 'Review must contain at least 10 characters.' } },
 status: { type: String, enum: ['draft', 'pending', 'approved', 'rejected'], default: 'pending', index: true },
 draftLabel: String,
 decisionAt: Date,
 notification: {
  status: { type: String, enum: ['not-sent', 'sent', 'failed'], default: 'not-sent' },
  attempts: { type: Number, default: 0 }, lastAttemptAt: Date, lastSentAt: Date, failureCode: String,
 },
 images: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CustomerReviewImage' }],
}, { timestamps: true });
export const CustomerReview = mongoose.model('CustomerReview', schema);
// Separate documents keep each photo below MongoDB's 16 MB document limit.
export const CustomerReviewImage = mongoose.model('CustomerReviewImage', new mongoose.Schema({
 review: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
 data: { type: Buffer, required: true },
 contentType: { type: String, required: true },
}));
