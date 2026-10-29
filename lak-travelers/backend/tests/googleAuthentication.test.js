import test from 'node:test';
import assert from 'node:assert/strict';
import { OAuth2Client } from 'google-auth-library';
import { authenticateGoogle } from '../utils/googleAuthentication.js';
import User from '../models/User.js';
import app from '../app.js';

const audience = 'test-client.apps.googleusercontent.com';
const now = Date.now();
const claims = { iss: 'https://accounts.google.com', aud: audience, exp: now / 1000 + 3600, sub: 'google-subject', email: 'traveler@gmail.com', email_verified: true, name: 'Traveler' };
function fixture(initial = [], payload = claims) {
 const records = initial.map(user => ({ ...user, matchPassword: async password => password === 'existing-password' }));
 const users = {
  async init() {},
  async findOne(query) { return records.find(user => Object.entries(query).every(([key, value]) => user[key] === value)); },
  async findOneAndUpdate(query, update) {
   const user = records.find(user => user._id === query._id && (user.googleId || null) === query.googleId && !user.isBanned && !user.isDisabled && (query.isApproved === undefined || user.isApproved));
   if (!user) return null;
   Object.assign(user, update.$set); return user;
  },
  async create(data) {
   if (records.some(user => user.email === data.email || user.googleId === data.googleId)) throw Object.assign(new Error('duplicate'), { code: 11000 });
   const user = { _id: 'created-user', ...data }; records.push(user); return user;
  },
 };
 const verify = async options => { assert.equal(options.audience, audience); assert.equal(options.idToken, 'test-token'); return { getPayload: () => payload }; };
 return { records, users, options: { users, verify, audience, now } };
}
test('Google signup creates only a regular user; linked sign-in retains stable subject and account data', async () => {
 const f = fixture();
 const first = await authenticateGoogle({ token: 'test-token', role: 'admin' }, f.options);
 assert.equal(first.role, 'user'); assert.equal(first.googleId, claims.sub); assert.equal(first.authProvider, 'google');
 const again = await authenticateGoogle({ token: 'test-token' }, f.options);
 assert.equal(again._id, first._id); assert.equal(f.records.length, 1);
 const renamed = fixture([{ _id: 'linked', googleId: claims.sub, email: 'old@gmail.com', role: 'user', password: 'preserved-hash' }]);
 const user = await authenticateGoogle({ token: 'test-token' }, renamed.options);
 assert.equal(user.email, 'old@gmail.com'); assert.equal(user.password, 'preserved-hash');
});
test('authoritative verified email links local account without changing password, role, approval or provider', async () => {
 const f = fixture([{ _id: 'local', email: claims.email, googleId: null, password: 'preserved-hash', role: 'admin', isApproved: true, authProvider: 'local' }]);
 const user = await authenticateGoogle({ token: 'test-token' }, f.options);
 assert.equal(user.googleId, claims.sub); assert.equal(user.password, 'preserved-hash'); assert.equal(user.role, 'admin'); assert.equal(user.authProvider, 'local'); assert.equal(user.isApproved, true);
});
test('third-party verified email requires the existing local password before linking', async () => {
 const payload = { ...claims, email: 'traveler@example.test' };
 const f = fixture([{ _id: 'local', email: payload.email, googleId: null, role: 'user' }], payload);
 for (const password of [undefined, 'incorrect']) {
  await assert.rejects(authenticateGoogle({ token: 'test-token', password }, f.options), { statusCode: 409, code: 'GOOGLE_LINK_REQUIRED' });
  assert.equal(f.records[0].googleId, null);
 }
 assert.equal((await authenticateGoogle({ token: 'test-token', password: 'existing-password' }, f.options)).googleId, claims.sub);
});
test('unverified email, wrong issuer/audience, expiry and missing stable identity are rejected before model access', async () => {
 for (const patch of [{ email_verified: false }, { email_verified: 'true' }, { iss: 'https://attacker.test' }, { aud: 'another-client' }, { exp: now / 1000 - 1 }, { exp: undefined }, { sub: '' }, { sub: undefined }, { email: 'invalid' }]) {
  const f = fixture([], { ...claims, ...patch });
  f.users.init = () => assert.fail('Invalid claims must not reach the database');
  await assert.rejects(authenticateGoogle({ token: 'test-token' }, f.options), { statusCode: 401 });
 }
 const f = fixture();
 await assert.rejects(authenticateGoogle({ token: 'test-token' }, { ...f.options, verify: async () => { throw new Error('raw-token-private'); } }), error => error.statusCode === 401 && !error.message.includes('raw-token-private'));
 await assert.rejects(authenticateGoogle({ token: null }, f.options), { statusCode: 400 });
 await assert.rejects(authenticateGoogle({ token: 'test-token' }, { ...f.options, audience: null }), { statusCode: 503 });
});
test('banned, disabled, pending vendor and conflicting Google identities cannot sign in or be relinked', async () => {
 for (const patch of [{ isBanned: true }, { isDisabled: true }, { role: 'vendor', isApproved: false }, { googleId: 'different-subject' }]) {
  const f = fixture([{ _id: 'existing', email: claims.email, googleId: null, role: 'user', ...patch }]);
  await assert.rejects(authenticateGoogle({ token: 'test-token' }, f.options), { statusCode: patch.googleId ? 409 : 403 });
  assert.equal(f.records[0].googleId, patch.googleId || null);
 }
});
test('duplicate creation and concurrent linking fail closed; unique subject index is present', async () => {
 const f = fixture(); f.users.create = async () => { throw Object.assign(new Error('duplicate'), { code: 11000 }); };
 await assert.rejects(authenticateGoogle({ token: 'test-token' }, f.options), { statusCode: 409 });
 const existing = fixture([{ _id: 'existing', email: claims.email, googleId: null }]);
 existing.users.findOneAndUpdate = async () => null;
 await assert.rejects(authenticateGoogle({ token: 'test-token' }, existing.options), { statusCode: 409 });
 assert.ok(User.schema.indexes().some(([keys, options]) => keys.googleId === 1 && options.unique && options.partialFilterExpression.googleId.$type === 'string'));
});
test('HTTP Google response matches login session and never leaks verification exceptions (isolated models)', async t => {
 const saved = { GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID, JWT_SECRET: process.env.JWT_SECRET };
 Object.assign(process.env, { GOOGLE_CLIENT_ID: audience, JWT_SECRET: 'isolated-google-test-secret' });
 t.after(() => { for (const [key, value] of Object.entries(saved)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } });
 const f = fixture([{ _id: 'existing', email: claims.email, googleId: claims.sub, role: 'user', isApproved: true }]);
 for (const name of ['init', 'findOne', 'findOneAndUpdate', 'create']) t.mock.method(User, name, f.users[name]);
 let invalid = false;
 t.mock.method(OAuth2Client.prototype, 'verifyIdToken', async () => { if (invalid) throw new Error('secret-token-exception'); return { getPayload: () => claims }; });
 const server = app.listen(0); await new Promise(resolve => server.once('listening', resolve));
 t.after(() => new Promise(resolve => server.close(resolve)));
 const base = `http://127.0.0.1:${server.address().port}/api/users/google`;
 const config = await (await fetch(base + '/config')).json(); assert.equal(config.clientId, audience);
 const post = () => fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: 'test-token', role: 'admin' }) });
 const response = await post(); assert.equal(response.status, 200); const user = await response.json();
 assert.equal(user.role, 'user'); assert.equal(user.isApproved, true); assert.ok(user.token); assert.equal(user.password, undefined); assert.equal(user.googleId, undefined);
 invalid = true; const failed = await post(); assert.equal(failed.status, 401); assert.ok(!(await failed.text()).includes('secret-token-exception'));
});
