import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';

const client = new OAuth2Client();
const error = (statusCode, message, code) => Object.assign(new Error(message), { statusCode, code });
export const googleClientId = () => {
  const id = process.env.GOOGLE_CLIENT_ID?.trim();
  return /^[\w.-]+\.apps\.googleusercontent\.com$/.test(id || '') ? id : null;
};

export async function authenticateGoogle({ token, password }, { users = User, verify = options => client.verifyIdToken(options), audience = googleClientId(), now = Date.now() } = {}) {
  if (!audience) throw error(503, 'Google sign-in is not available yet. Please use email and password.');
  if (typeof token !== 'string' || !token || token.length > 16000) throw error(400, 'Please choose your Google account and try again.');
  let payload;
  try { payload = (await verify({ idToken: token, audience })).getPayload(); }
  catch { throw error(401, 'Google could not verify your sign-in. Please try again.'); }
  if (!payload || !['accounts.google.com', 'https://accounts.google.com'].includes(payload.iss)
    || payload.aud !== audience || !Number.isFinite(payload.exp) || payload.exp <= now / 1000
    || typeof payload.sub !== 'string' || !payload.sub.trim() || payload.sub.length > 255
    || payload.email_verified !== true || typeof payload.email !== 'string'
    || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email) || payload.email.length > 254) {
    throw error(401, 'Please use a verified Google account and try signing in again.');
  }
  const email = payload.email.trim().toLowerCase();
  // Await unique indexes before creating/linking accounts; never rebuild or drop indexes.
  await users.init();
  try {
    let user = await users.findOne({ googleId: payload.sub });
    if (!user) user = await users.findOne({ email });
    if (user) {
      if (user.isBanned || user.isDisabled || (user.role === 'vendor' && !user.isApproved)) {
        throw error(403, 'This account is unavailable or awaiting approval. Please contact support.');
      }
      if (user.googleId && user.googleId !== payload.sub) throw error(409, 'This account is linked to a different Google account. Please use your original sign-in method.');
      if (!user.googleId) {
        // Google is not authoritative for third-party email addresses without a Workspace hd claim.
        const authoritative = email.endsWith('@gmail.com') || (typeof payload.hd === 'string' && Boolean(payload.hd.trim()));
        if (!authoritative && (typeof password !== 'string' || password.length > 1024 || !await user.matchPassword(password))) {
          throw error(409, 'Enter your existing LakTravelers password to securely link this Google account.', 'GOOGLE_LINK_REQUIRED');
        }
      }
      user = await users.findOneAndUpdate({ _id: user._id, googleId: user.googleId || null,
        isBanned: { $ne: true }, isDisabled: { $ne: true }, ...(user.role === 'vendor' ? { isApproved: true } : {}) },
      { $set: { googleId: payload.sub, lastLogin: new Date(now) } }, { new: true, runValidators: true });
      if (!user) throw error(409, 'Your account changed during sign-in. Please try again.');
      return user;
    }
    return await users.create({ name: typeof payload.name === 'string' && payload.name.trim() ? payload.name.trim().slice(0, 120) : email.split('@')[0],
      email, googleId: payload.sub, authProvider: 'google', role: 'user', isApproved: true, lastLogin: new Date(now) });
  } catch (err) {
    if (err.code === 11000) throw error(409, 'This account was just created or linked. Please sign in again.');
    throw err;
  }
}
