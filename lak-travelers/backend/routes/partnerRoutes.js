import express from 'express';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import { randomBytes, createHash } from 'node:crypto';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { PartnerProfile, PartnerSession, PartnerToken, PartnerApplication, PartnerDocument } from '../models/Partner.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { authLimiter, uploadLimiter } from '../middleware/rateLimitMiddleware.js';
import { sendEmail, emailConfig } from '../utils/sendEmail.js';
import { email, password, fail, category, validateDetails, checkSubmission, expiryDate, validateUpload, checkTransition } from '../utils/partnerValidation.js';
import { editableStatuses, MAX_FILE_SIZE, statuses } from '../../shared/partnerFields.mjs';

const router = express.Router();
export const digest = value => createHash('sha256').update(value).digest('hex');
const cookieName = 'lak_partner_session';
const dummyPasswordHash = bcrypt.hashSync('not-a-real-partner-account', 10);
const cookieOptions = () => ({ httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', path: '/api/partners' });
const publicUser = user => ({ id: user.id || String(user._id), name: user.name, email: user.email });
const checkToken = token => { if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) fail('Invalid or expired code.'); return digest(token); };
const id = value => { if (!mongoose.isObjectIdOrHexString(value)) fail('Application not found.', 404); return value; };
const version = value => { if (!Number.isInteger(value) || value < 0) fail('A valid application version is required.'); return value; };
export function partnerCsrf(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const allowed = new Set(['https://laktravelers.com', 'https://www.laktravelers.com', 'https://laktravelers.pages.dev', 'https://laktravelers-web.pages.dev',
    ...(process.env.NODE_ENV === 'production' ? [] : ['http://localhost:5173', 'http://127.0.0.1:5173']),
    ...[process.env.ALLOWED_ORIGINS, process.env.FRONTEND_URL].filter(Boolean).join(',').split(',').map(s => s.trim())]);
  if (!allowed.has(req.headers.origin) || req.get('X-Requested-With') !== 'LakTravelersPartner') return res.status(403).json({ message: 'Request origin or CSRF header is invalid.' });
  next();
}
router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
router.use(partnerCsrf);

async function sendToken(user, purpose) {
  emailConfig();
  const raw = randomBytes(32).toString('hex');
  const token = await PartnerToken.create({ user: user._id, email: user.email, purpose, hash: digest(raw), expiresAt: new Date(Date.now() + 30 * 60 * 1000) });
  try {
    const result = await sendEmail({ to: user.email, subject: purpose === 'verify' ? 'Welcome — verify your LakTravelers partner email' : 'Reset your LakTravelers partner password',
      text: `Your ${purpose === 'verify' ? 'email verification' : 'password reset'} code is:\n\n${raw}\n\nPaste it into the partner account form. It expires in 30 minutes. If you did not request this, ignore this email.\nContact: laktravelers@gmail.com` });
    if (!result.accepted?.length) throw new Error('Delivery not accepted');
  } catch {
    await PartnerToken.deleteOne({ _id: token._id });
    fail('Email could not be sent. Please retry later.', 503);
  }
}
export async function partnerAuth(req, _res, next) {
  const raw = req.cookies?.[cookieName];
  if (typeof raw !== 'string' || !/^[a-f0-9]{64}$/.test(raw)) fail('Please log in to your partner account.', 401);
  const session = await PartnerSession.findOne({ hash: digest(raw), expiresAt: { $gt: new Date() } });
  if (!session) fail('Session expired. Please log in again.', 401);
  const user = await User.findById(session.user);
  if (!user || !user.password || user.isBanned || user.isDisabled || session.credentialHash !== digest(user.password)) fail('Session expired. Please log in again.', 401);
  const profile = await PartnerProfile.findOne({ user: user._id });
  if (!profile) fail('Partner account not found.', 403);
  req.partner = { user, profile, session };
  next();
}
const verified = (req, _res, next) => {
  if (req.partner.profile.verifiedEmail !== req.partner.user.email) fail('Verify your email before starting an application.', 403);
  next();
};
router.post('/auth/register', authLimiter, async (req, res) => {
  const address = email(req.body.email); const secret = password(req.body.password);
  if (typeof req.body.name !== 'string' || !req.body.name.trim() || req.body.name.length > 150 || req.body.consent !== true) fail('Name and privacy consent are required.');
  emailConfig();
  const existing = await User.findOne({ email: address });
  if (existing) return res.json({ message: 'If this email is already registered, log in or reset your password. Otherwise check your inbox.' });
  const user = await User.create({ name: req.body.name.trim(), email: address, password: secret, role: 'user' });
  await PartnerProfile.create({ user: user._id, consentAt: new Date() });
  await sendToken(user, 'verify');
  res.status(201).json({ message: 'Account created. Check your email for a verification code, then log in.' });
});
router.post('/auth/login', authLimiter, async (req, res) => {
  const address = email(req.body.email);
  if (typeof req.body.password !== 'string' || Buffer.byteLength(req.body.password) > 72) fail('Invalid credentials.', 401);
  const user = await User.findOne({ email: address });
  const valid = await bcrypt.compare(req.body.password, user?.password || dummyPasswordHash);
  if (!user || !user.password || !valid || user.isBanned || user.isDisabled) fail('Invalid credentials.', 401);
  let profile = await PartnerProfile.findOne({ user: user._id });
  if (!profile) {
    if (req.body.consent !== true) fail('Accept partner privacy consent to continue.');
    profile = await PartnerProfile.findOneAndUpdate({ user: user._id }, { $setOnInsert: { consentAt: new Date(), consentVersion: '2026-11-21' } }, { upsert: true, new: true });
  }
  const raw = randomBytes(32).toString('hex');
  await PartnerSession.create({ user: user._id, hash: digest(raw), credentialHash: digest(user.password), expiresAt: new Date(Date.now() + 7 * 86400000) });
  res.cookie(cookieName, raw, { ...cookieOptions(), maxAge: 7 * 86400000 });
  res.json({ user: publicUser(user), verified: profile.verifiedEmail === user.email });
});
router.post('/auth/forgot', authLimiter, async (req, res) => {
  const address = email(req.body.email); emailConfig();
  const user = await User.findOne({ email: address });
  if (user && !user.isBanned && !user.isDisabled && await PartnerProfile.exists({ user: user._id })) await sendToken(user, 'reset');
  res.json({ message: 'If a partner account matches, a reset code has been emailed.' });
});
router.post('/auth/reset', authLimiter, async (req, res) => {
  const address = email(req.body.email); const secret = password(req.body.password);
  const token = await PartnerToken.findOneAndDelete({ hash: checkToken(req.body.token), email: address, purpose: 'reset', expiresAt: { $gt: new Date() } });
  if (!token) fail('Invalid or expired code.');
  const hashed = await bcrypt.hash(secret, 12);
  const user = await User.findOneAndUpdate({ _id: token.user, email: address, isBanned: { $ne: true }, isDisabled: { $ne: true } }, { $set: { password: hashed } });
  if (!user) fail('Invalid or expired code.');
  await Promise.all([PartnerSession.deleteMany({ user: token.user }), PartnerToken.deleteMany({ user: token.user, purpose: 'reset' })]);
  res.clearCookie(cookieName, cookieOptions());
  res.json({ message: 'Password reset. Log in again on each device.' });
});
router.get('/auth/me', partnerAuth, (req, res) => res.json({ user: publicUser(req.partner.user), verified: req.partner.profile.verifiedEmail === req.partner.user.email }));
router.post('/auth/logout', partnerAuth, async (req, res) => {
  await PartnerSession.deleteOne({ _id: req.partner.session._id });
  res.clearCookie(cookieName, cookieOptions()); res.json({ message: 'Logged out.' });
});
router.post('/auth/send-verification', authLimiter, partnerAuth, async (req, res) => {
  if (req.partner.profile.verifiedEmail !== req.partner.user.email) await sendToken(req.partner.user, 'verify');
  res.json({ message: 'Check your email for a verification code.' });
});
router.post('/auth/verify', authLimiter, partnerAuth, async (req, res) => {
  const token = await PartnerToken.findOneAndDelete({ user: req.partner.user._id, email: req.partner.user.email, hash: checkToken(req.body.token), purpose: 'verify', expiresAt: { $gt: new Date() } });
  if (!token) fail('Invalid or expired code.');
  await PartnerProfile.updateOne({ user: token.user }, { $set: { verifiedEmail: token.email } });
  res.json({ message: 'Email verified.' });
});

async function owned(req, edit = false) {
  const application = await PartnerApplication.findOne({ _id: id(req.params.id), owner: req.partner.user._id });
  if (!application) fail('Application not found.', 404);
  if (edit && !editableStatuses.includes(application.status)) fail('Only drafts and requested corrections may be edited.', 409);
  if (edit && application.__v !== version(req.body.version)) fail('Application changed. Reload and retry.', 409);
  return application;
}
function audit(application, actor, action, note = '', notify = false) {
  application.history.push({ actor, action, note, notification: notify ? 'pending' : 'none' });
  return application.history[application.history.length - 1]._id;
}
async function notify(application, eventId) {
  const user = await User.findById(application.owner).select('email');
  const event = application.history.id(eventId);
  let state = 'sent';
  try {
    const result = await sendEmail({ to: user.email, subject: `LakTravelers application: ${event.action}`,
      text: `Your ${application.category} application (${application._id}) has an update: ${event.action}.\n${event.note || ''}\nLog in to your partner dashboard for details.\nQuestions: laktravelers@gmail.com / +94 76 289 8945` });
    if (!result.accepted?.length) throw new Error('Not accepted');
  } catch { state = 'failed'; }
  await PartnerApplication.updateOne({ _id: application._id, 'history._id': eventId }, { $set: { 'history.$.notification': state } });
  return state;
}
router.get('/applications', partnerAuth, verified, async (req, res) => {
  res.json(await PartnerApplication.find({ owner: req.partner.user._id }).sort({ updatedAt: -1 }).limit(100));
});
router.post('/applications', partnerAuth, verified, async (req, res) => {
  category(req.body.category);
  if (await PartnerApplication.countDocuments({ owner: req.partner.user._id }) >= 100) fail('Application limit reached. Contact support.');
  const application = new PartnerApplication({ owner: req.partner.user._id, category: req.body.category, details: { name: req.partner.user.name, email: req.partner.user.email } });
  audit(application, req.partner.user._id, 'Draft created');
  await application.save(); res.status(201).json(application);
});
router.put('/applications/:id', partnerAuth, verified, async (req, res) => {
  const application = await owned(req, true);
  application.details = validateDetails(application.category, req.body.details);
  application.expiryDate = expiryDate(Object.fromEntries(application.details));
  audit(application, req.partner.user._id, 'Draft saved');
  await application.save(); res.json(application);
});
router.post('/applications/:id/submit', partnerAuth, verified, async (req, res) => {
  const application = await owned(req, true);
  const details = checkSubmission(application);
  if (req.body.consent !== true) fail('Confirm that the information is accurate and consent to verification.');
  application.expiryDate = expiryDate(details);
  application.status = 'Submitted'; application.licenceVerifiedAt = undefined; application.licenceVerifiedBy = undefined;
  const eventId = audit(application, req.partner.user._id, 'Submitted', 'Applicant confirmed accuracy and consented to document verification.', true);
  await application.save(); const notification = await notify(application, eventId);
  res.json({ application, notification });
});
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_FILE_SIZE, files: 1, fields: 1, fieldSize: 100, parts: 2 } }).single('file');
router.post('/applications/:id/documents/:slot', partnerAuth, verified, uploadLimiter, upload, async (req, res) => {
  // Multipart fields are strings; normalize only the explicit version field.
  req.body.version = /^\d+$/.test(req.body.version || '') ? Number(req.body.version) : NaN;
  const application = await owned(req, true); const slot = req.params.slot;
  if (!category(application.category).documents.includes(slot)) fail('Invalid document slot.');
  const { mime, extension } = validateUpload(req.file, slot);
  const documentId = new mongoose.Types.ObjectId();
  const document = await PartnerDocument.create({ _id: documentId, application: application._id, owner: req.partner.user._id, slot, mime, size: req.file.size, filename: `${documentId}.${extension}`, sha256: digest(req.file.buffer), data: req.file.buffer });
  const previous = application.documents.get(slot);
  application.documents.set(slot, document._id); audit(application, req.partner.user._id, 'Document replaced', slot);
  try { await application.save(); } catch (error) { await PartnerDocument.deleteOne({ _id: document._id }); throw error; }
  if (previous) await PartnerDocument.deleteOne({ _id: previous });
  res.status(201).json(application);
});
async function download(req, res, application) {
  const docId = application.documents.get(req.params.slot);
  if (!docId) fail('Document not found.', 404);
  const doc = await PartnerDocument.findOne({ _id: docId, application: application._id, owner: application.owner }).select('+data');
  if (!doc) fail('Document not found.', 404);
  // Always download untrusted content; never render PDFs/HTML in the application origin.
  res.set({ 'Content-Type': doc.mime, 'Content-Disposition': `attachment; filename="${doc.filename}"`, 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "sandbox; default-src 'none'" });
  res.send(doc.data);
}
router.get('/applications/:id/documents/:slot', partnerAuth, verified, async (req, res) => download(req, res, await owned(req)));

router.use('/admin', protect, admin);
router.get('/admin/applications', async (req, res) => {
  const query = {};
  if (req.query.status) { if (!statuses.includes(req.query.status)) fail('Invalid status.'); query.status = req.query.status; }
  if (req.query.category) { category(req.query.category); query.category = req.query.category; }
  if (req.query.search) {
    if (typeof req.query.search !== 'string' || req.query.search.length > 100) fail('Search is too long.');
    const escaped = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = ['details.name', 'details.email', 'details.registrationNumber'].map(k => ({ [k]: { $regex: escaped, $options: 'i' } }));
  }
  if (req.query.expiring === 'true') query.expiryDate = { $lte: new Date(Date.now() + 30 * 86400000) };
  const page = Math.max(1, Math.min(10000, Number.parseInt(req.query.page, 10) || 1));
  const [applications, total] = await Promise.all([PartnerApplication.find(query).sort({ updatedAt: -1 }).skip((page - 1) * 25).limit(25), PartnerApplication.countDocuments(query)]);
  res.json({ applications, total, page });
});
async function adminApplication(req) {
  const application = await PartnerApplication.findById(id(req.params.id));
  if (!application) fail('Application not found.', 404);
  return application;
}
router.get('/admin/applications/:id', async (req, res) => res.json(await adminApplication(req)));
router.get('/admin/applications/:id/documents/:slot', async (req, res) => {
  const application = await adminApplication(req);
  // Atomic append avoids races with an in-progress review; document reads are audited.
  await PartnerApplication.updateOne({ _id: application._id }, { $push: { history: { actor: req.user._id, action: 'Document accessed', note: req.params.slot, at: new Date(), notification: 'none' } } });
  await download(req, res, application);
});
router.post('/admin/applications/:id/decision', async (req, res) => {
  const application = await adminApplication(req);
  if (application.__v !== version(req.body.version)) fail('Application changed. Reload before deciding.', 409);
  checkTransition(application, req.body.status, req.body.note, req.body.licencesVerified);
  application.status = req.body.status;
  if (application.status === 'Approved') { application.licenceVerifiedAt = new Date(); application.licenceVerifiedBy = req.user._id; }
  const eventId = audit(application, req.user._id, application.status, req.body.note.trim(), true);
  await application.save(); const notification = await notify(application, eventId);
  res.json({ application, notification });
});
router.post('/admin/applications/:id/notifications/:eventId/retry', async (req, res) => {
  const application = await adminApplication(req);
  const event = application.history.id(id(req.params.eventId));
  if (!event || !['failed', 'pending'].includes(event.notification)) fail('Notification does not need retrying.');
  const notification = await notify(application, event._id);
  await PartnerApplication.updateOne({ _id: application._id }, { $push: { history: { actor: req.user._id, action: 'Notification retried', note: String(event._id), at: new Date(), notification: 'none' } } });
  res.json({ notification });
});
// Partner-specific failures never return stack traces or internal database/provider details.
router.use((error, _req, res, _next) => {
  const conflict = ['VersionError', 'DocumentNotFoundError'].includes(error.name) || error.code === 11000;
  const status = error instanceof multer.MulterError ? 400 : conflict ? 409 : error.statusCode || (res.statusCode >= 400 ? res.statusCode : error.name === 'ValidationError' ? 400 : 500);
  res.status(status).json({ message: status >= 500 ? 'Partner service temporarily unavailable. Please retry or contact laktravelers@gmail.com.' : conflict ? 'The record changed or already exists. Reload and retry.' : error instanceof multer.MulterError ? 'Upload one file, maximum 5 MB, with its application version.' : error.message });
});
export default router;
