import mongoose from 'mongoose';
import { statuses } from '../../shared/partnerFields.mjs';
const { Schema } = mongoose;
const ref = { type: Schema.Types.ObjectId, ref: 'User', required: true };
const profileSchema = new Schema({
  user: { ...ref, unique: true }, verifiedEmail: String, consentAt: { type: Date, required: true }, consentVersion: { type: String, default: '2026-11-21' },
}, { timestamps: true });
const sessionSchema = new Schema({
  hash: { type: String, unique: true, required: true }, user: ref, credentialHash: { type: String, required: true }, expiresAt: { type: Date, required: true },
}, { timestamps: true });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
const tokenSchema = new Schema({
  hash: { type: String, required: true, unique: true }, user: ref, email: String,
  purpose: { type: String, enum: ['verify', 'reset'], required: true }, expiresAt: { type: Date, required: true },
});
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
const documentSchema = new Schema({
  application: { type: Schema.Types.ObjectId, ref: 'PartnerApplication', required: true, index: true }, owner: ref,
  slot: String, mime: String, size: Number, filename: String, sha256: String,
  data: { type: Buffer, required: true, select: false },
}, { timestamps: true });
const historySchema = new Schema({
  actor: ref, action: String, note: String, at: { type: Date, default: Date.now },
  notification: { type: String, enum: ['pending', 'sent', 'failed', 'none'], default: 'none' },
});
// LT_ATOMIC_PARTNER_IDS_V1: category-scoped, atomic and persistent numbering.
const partnerSequenceSchema = new Schema({
  _id: { type: String, enum: ['guide', 'driver', 'vehicle'], required: true },
  value: { type: Number, default: 0, required: true, min: 0 },
}, { versionKey: false });
export const PartnerSequence = mongoose.models.PartnerSequence || mongoose.model('PartnerSequence', partnerSequenceSchema);

async function allocatePartnerId(kind) {
  const prefix = { guide: 'LG', driver: 'LD', vehicle: 'LV' }[kind];
  if (!prefix) throw new Error('Invalid partner category');
  const counter = await PartnerSequence.findOneAndUpdate(
    { _id: kind }, { $inc: { value: 1 } }, { new: true, upsert: true }
  );
  return prefix + String(counter.value).padStart(5, '0');
}

const applicationSchema = new Schema({
  owner: { ...ref, index: true }, partnerId: { type: String, unique: true, sparse: true, immutable: true, match: /^(LG|LD|LV)\d{5,}$/ }, category: { type: String, enum: ['guide', 'driver', 'vehicle'], required: true },
  status: { type: String, enum: statuses, default: 'Draft', index: true },
  details: { type: Map, of: String, default: {} },
  documents: { type: Map, of: { type: Schema.Types.ObjectId, ref: 'PartnerDocument' }, default: {} },
  licenceVerifiedAt: Date, licenceVerifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  expiryDate: { type: Date, index: true },
  // No self-drive authorization is granted by this onboarding workflow.
  selfDriveAuthorized: { type: Boolean, default: false, immutable: true },
  history: [historySchema],
}, { timestamps: true, optimisticConcurrency: true });
applicationSchema.pre('save', async function () {
  if (this.isNew && !this.partnerId) this.partnerId = await allocatePartnerId(this.category);
});
applicationSchema.index({ owner: 1, updatedAt: -1 });
applicationSchema.index({ status: 1, category: 1, updatedAt: -1 });
export const PartnerProfile = mongoose.model('PartnerProfile', profileSchema);
export const PartnerSession = mongoose.model('PartnerSession', sessionSchema);
export const PartnerToken = mongoose.model('PartnerToken', tokenSchema);
export const PartnerDocument = mongoose.model('PartnerDocument', documentSchema);
export const PartnerApplication = mongoose.model('PartnerApplication', applicationSchema);
