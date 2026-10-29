import { emailConfig, sendEmail } from './sendEmail.js';
import { CustomerReview } from '../models/CustomerReview.js';
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
export function reviewEmailConfig(env = process.env) {
 const missing = ['ADMIN_REVIEW_EMAIL', 'PUBLIC_APP_URL'].filter(key => !env[key]);
 if (missing.length) throw Object.assign(new Error('Review email configuration missing'), { code: 'CONFIG_MISSING', missing });
 const base = new URL(env.PUBLIC_APP_URL);
 if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || (env.NODE_ENV === 'production' && base.protocol !== 'https:')) throw Object.assign(new Error('Invalid public app URL'), { code: 'CONFIG_INVALID' });
 return { ...emailConfig(env), to: env.ADMIN_REVIEW_EMAIL, base: base.origin };
}
export function reviewEmail(review, config) {
 const link = action => `${config.base}/admin/reviews/${review._id}/decision?action=${action}`;
 const photos = `${config.base}/admin/reviews/${review._id}/decision?action=approve`;
 const date = new Date(review.createdAt).toISOString();
 const stars = '★'.repeat(review.rating) + '☆'.repeat(5-review.rating);
 const text = `LakTravelers\nA Brand of IDW (Pvt) Ltd\n\nNew Customer Review\nCustomer Name: ${review.name}\nRating: ${review.rating}/5 ${stars}\nReview: ${review.comment}\nSubmitted Date: ${date}\nPhotos: ${review.images.length} — view securely after admin sign-in: ${photos}\n\nAPPROVE REVIEW: ${link('approve')}\nREJECT REVIEW: ${link('reject')}\n\nLinks open a confirmation page. Admin sign-in and final confirmation are required.`;
 const button = (action, color) => `<a href="${escape(link(action))}" style="display:inline-block;margin:8px 8px 8px 0;padding:14px 20px;background:${color};color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold">${action.toUpperCase()} REVIEW</a>`;
 return { from: config.from, to: config.to, subject: 'New LakTravelers Customer Review - Approval Required', text,
 html: `<div style="background:#f1f5f9;padding:24px;font-family:Arial,sans-serif;color:#0f172a"><div style="max-width:600px;margin:auto;background:#ffffff;padding:28px;border-radius:12px"><h1 style="color:#2563eb;margin-bottom:4px">LakTravelers</h1><p style="color:#475569;margin-top:0">A Brand of IDW (Pvt) Ltd</p><h2>New Customer Review</h2><p><b>Customer Name:</b> ${escape(review.name)}</p><p><b>Rating:</b> ${review.rating}/5 <span style="color:#b45309">${stars}</span></p><p><b>Review:</b></p><p style="white-space:pre-wrap">${escape(review.comment)}</p><p><b>Submitted Date:</b> ${escape(date)}</p><p><b>Photos:</b> ${review.images.length} — <a href="${escape(photos)}">View submitted photos securely (admin sign-in required)</a></p>${button('approve','#2563eb')}${button('reject','#b91c1c')}<p style="font-size:12px;color:#475569">Opening a link does not change the review. Sign in as an administrator and confirm your decision.</p></div></div>` };
}
export async function notifyReview(review, createTransport) {
 let result;
 try {
  const config = reviewEmailConfig();
  const sent = await sendEmail(reviewEmail(review, config), { createTransport });
  if (sent.rejected?.length || !sent.accepted?.length) throw Object.assign(new Error('Recipient not accepted'), { code:'SMTP_REJECTED' });
  result = { status: 'sent', lastSentAt: new Date(), failureCode: '' };
 } catch (error) {
  const code = ['CONFIG_MISSING','CONFIG_INVALID','EMAIL_API_FAILED'].includes(error.code) ? error.code : 'SMTP_FAILED';
  // Never log transport errors, which may contain credentials or message contents.
  console.warn('Review notification failed', { reviewId: String(review._id), code, ...(error.missing ? { missing: error.missing } : {}) });
  result = { status: 'failed', failureCode: code };
 }
 try {
  await CustomerReview.updateOne({ _id: review._id }, { $set: { 'notification.status':result.status, 'notification.failureCode':result.failureCode, 'notification.lastAttemptAt':new Date(), ...(result.lastSentAt ? { 'notification.lastSentAt':result.lastSentAt } : {}) }, $inc:{ 'notification.attempts':1 } });
 } catch { console.warn('Review notification tracking could not be saved', { reviewId:String(review._id) }); }
 return result;
}
