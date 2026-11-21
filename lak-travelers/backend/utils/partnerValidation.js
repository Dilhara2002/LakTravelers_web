import { partnerCategories, MAX_FILE_SIZE, isPhoto } from '../../shared/partnerFields.mjs';
export const fail = (message, statusCode = 400) => { throw Object.assign(new Error(message), { statusCode }); };
export function email(value) {
  if (typeof value !== 'string' || value.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) fail('Enter a valid email address.');
  return value.trim().toLowerCase();
}
export function password(value) {
  if (typeof value !== 'string' || value.length < 12 || Buffer.byteLength(value) > 72) fail('Use a password of at least 12 characters and at most 72 bytes.');
  return value;
}
export function category(value) {
  if (!Object.hasOwn(partnerCategories, value)) fail('Invalid partner category.');
  return partnerCategories[value];
}
export function validateDetails(kind, input, complete = false, now = new Date()) {
  const spec = category(kind);
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail('Invalid application details.');
  const allowed = new Set(spec.fields.map(f => f.key));
  if (Object.keys(input).some(k => !allowed.has(k))) fail('Unsupported application field.');
  const result = {};
  for (const f of spec.fields) {
    const value = input[f.key] ?? '';
    if (typeof value !== 'string' || value.length > (f.type === 'textarea' ? 2000 : 300)) fail(`Invalid ${f.label}.`);
    const text = value.trim();
    if (!text) { if (complete) fail(`${f.label} is required.`); continue; }
    if (f.options && !f.options.includes(text)) fail(`Invalid ${f.label}.`);
    if (f.type === 'email') email(text);
    if (f.type === 'tel' && !/^\+?[\d ()-]{7,25}$/.test(text)) fail('Enter a valid WhatsApp number.');
    if (f.key === 'nic' && !/^(?:\d{9}[vVxX]|\d{12})$/.test(text)) fail('Enter a valid Sri Lankan NIC number.');
    if (f.type === 'number') {
      const min = f.key === 'year' ? 1950 : f.key === 'seats' ? 1 : 0;
      const max = f.key === 'year' ? now.getUTCFullYear() + 1 : f.key === 'seats' ? 100 : 80;
      if (!/^\d+$/.test(text) || Number(text) < min || Number(text) > max) fail(`Invalid ${f.label}.`);
    }
    if (f.type === 'date') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || !Number.isFinite(Date.parse(text)) || new Date(text).toISOString().slice(0, 10) !== text) fail(`Invalid ${f.label}.`);
      const today = now.toISOString().slice(0, 10);
      if (complete && f.key.endsWith('Expiry') && text < today) fail(`${f.label} has expired.`);
      if (f.key.endsWith('Issued') && text > today) fail('Issue date cannot be in the future.');
    }
    result[f.key] = text;
  }
  if (result.licenceIssued && result.licenceExpiry && result.licenceIssued > result.licenceExpiry) fail('Licence expiry must follow its issue date.');
  return result;
}
export function checkSubmission(application, now) {
  const details = application.details instanceof Map ? Object.fromEntries(application.details) : application.details;
  const clean = validateDetails(application.category, details, true, now);
  const docs = application.documents instanceof Map ? Object.fromEntries(application.documents) : application.documents;
  for (const key of category(application.category).documents) if (!docs?.[key]) fail(`${key} document is required.`);
  return clean;
}
export function expiryDate(details) {
  const dates = Object.entries(details).filter(([k, v]) => k.endsWith('Expiry') && v).map(([, v]) => v).sort();
  return dates.length ? new Date(`${dates[0]}T23:59:59.999Z`) : undefined;
}
export function validateUpload(file, slot) {
  if (!file || !file.buffer?.length || file.size > MAX_FILE_SIZE) fail('Upload a file up to 5 MB.');
  const b = file.buffer;
  let mime;
  if (b.length > 12 && b.subarray(0, 3).equals(Buffer.from([255, 216, 255])) && b.subarray(-2).equals(Buffer.from([255, 217]))) mime = 'image/jpeg';
  else if (b.length >= 45 && b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) && b.subarray(12, 16).toString() === 'IHDR' && b.subarray(-8, -4).toString() === 'IEND') mime = 'image/png';
  else if (b.length > 20 && b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP' && b.readUInt32LE(4) + 8 === b.length && ['VP8 ', 'VP8L', 'VP8X'].includes(b.subarray(12, 16).toString())) mime = 'image/webp';
  else if (b.subarray(0, 5).toString() === '%PDF-' && b.subarray(-1024).toString().trimEnd().endsWith('%%EOF')) mime = 'application/pdf';
  if (!mime || mime !== file.mimetype || (isPhoto(slot) && mime === 'application/pdf')) fail('File contents must match JPG, PNG, WebP or PDF; photos must be images.');
  return { mime, extension: { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' }[mime] };
}
export const transitions = {
  Submitted: ['Under Review', 'Changes Requested', 'Rejected'],
  'Under Review': ['Approved', 'Changes Requested', 'Rejected'],
  Approved: ['Suspended', 'Changes Requested'],
  Suspended: ['Under Review', 'Changes Requested', 'Rejected'],
  Rejected: ['Changes Requested'],
};
export function checkTransition(application, target, note, verified) {
  if (!transitions[application.status]?.includes(target)) fail('This status transition is not allowed.', 409);
  if (typeof note !== 'string' || note.trim().length < 3 || note.length > 2000) fail('Provide an audit note (3–2000 characters).');
  if (target === 'Approved') {
    checkSubmission(application);
    if (verified !== true) fail('Manually verify all licences and documents before approval.');
  }
}
