import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import app from '../app.js';
import User from '../models/User.js';
import GalleryPhoto from '../models/GalleryPhoto.js';
import { sendEmail } from '../utils/sendEmail.js';

const testEnv = { EMAIL_PROVIDER: 'resend', RESEND_API_KEY: 'test-only', EMAIL_FROM: 'test@example.test' };
test('HTTPS email accepts successful requests and safely rejects provider failures', async () => {
 const result = await sendEmail({ to: 'recipient@example.test', subject: 'Test', text: 'Test only' }, { env: testEnv, fetchImpl: async (url, options) => {
  assert.equal(url, 'https://api.resend.com/emails');
  assert.deepEqual(JSON.parse(options.body).to, ['recipient@example.test']);
  return { ok: true, json: async () => ({ id: 'test-email' }) };
 }});
 assert.equal(result.accepted.length, 1);
 await assert.rejects(sendEmail({ to: 'recipient@example.test' }, { env: testEnv, fetchImpl: async () => ({ ok: false }) }), { code: 'EMAIL_API_FAILED' });
});

test('gallery upload stays private, requires admin, persists bytes and supports publish/edit/delete (isolated models)', async t => {
 const old = process.env.JWT_SECRET; process.env.JWT_SECRET = 'gallery-test-secret';
 t.after(() => { if (old === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = old; });
 const records = [];
 t.mock.method(User, 'findById', id => ({ select: async () => ({ _id: id, role: id === 'admin-test' ? 'admin' : 'user' }) }));
 t.mock.method(GalleryPhoto, 'create', async data => { const record = new GalleryPhoto(data); records.push(record); return record; });
 t.mock.method(GalleryPhoto, 'find', query => ({ sort() { return this; }, limit() { return this; }, lean: async () => records.filter(r => query.published === undefined || r.published === query.published).map(r => ({ _id: r._id, caption: r.caption, published: r.published })) }));
 t.mock.method(GalleryPhoto, 'findOne', query => ({ select: async () => records.find(r => String(r._id) === query._id && (query.published === undefined || r.published === query.published)) }));
 t.mock.method(GalleryPhoto, 'findByIdAndUpdate', async (id, update) => { const r = records.find(r => String(r._id) === id); if (r) Object.assign(r, update.$set); return r; });
 t.mock.method(GalleryPhoto, 'findByIdAndDelete', async id => { const index = records.findIndex(r => String(r._id) === id); return index < 0 ? null : records.splice(index, 1)[0]; });
 const server = app.listen(0); await new Promise(resolve => server.once('listening', resolve));
 t.after(() => new Promise(resolve => server.close(resolve)));
 const base = `http://127.0.0.1:${server.address().port}/api/gallery`;
 const auth = role => ({ Authorization: `Bearer ${jwt.sign({ userId: role }, process.env.JWT_SECRET, { issuer: 'lak-travelers-api', audience: 'lak-travelers-client' })}` });
 assert.equal((await fetch(`${base}/admin`)).status, 401);
 assert.equal((await fetch(`${base}/admin`, { headers: auth('user-test') })).status, 403);
 const body = new FormData(); body.set('caption', 'Isolated test photo');
 const bytes = Buffer.from([137,80,78,71,13,10,26,10,0]);
 body.set('photo', new Blob([bytes], { type: 'image/png' }), 'test.png');
 const uploaded = await fetch(base, { method: 'POST', headers: auth('admin-test'), body });
 assert.equal(uploaded.status, 201); const photo = await uploaded.json(); assert.equal(photo.published, false);
 assert.equal((await (await fetch(base)).json()).length, 0);
 assert.equal((await fetch(`${base}/photos/${photo._id}`)).status, 404);
 assert.equal((await fetch(`${base}/admin/photos/${photo._id}`, { headers: auth('user-test') })).status, 403);
 const privatePhoto = await fetch(`${base}/admin/photos/${photo._id}`, { headers: auth('admin-test') });
 assert.deepEqual(Buffer.from(await privatePhoto.arrayBuffer()), bytes);
 const headers = { ...auth('admin-test'), 'Content-Type': 'application/json' };
 assert.equal((await fetch(`${base}/${photo._id}`, { method: 'PATCH', headers, body: JSON.stringify({ published: true, caption: 'Edited test caption' }) })).status, 200);
 assert.equal((await (await fetch(base)).json()).length, 1);
 assert.deepEqual(Buffer.from(await (await fetch(`${base}/photos/${photo._id}`)).arrayBuffer()), bytes);
 assert.equal((await fetch(`${base}/${photo._id}`, { method: 'DELETE', headers })).status, 204);
 assert.equal(records.length, 0);
});

test('email/password login, OTP registration, role restriction and email failure use isolated users only', async t => {
 const saved = Object.fromEntries([...Object.keys(testEnv), 'NODE_ENV', 'JWT_SECRET'].map(key => [key, process.env[key]]));
 Object.assign(process.env, testEnv, { NODE_ENV: 'production', JWT_SECRET: 'isolated-auth-secret' });
 t.after(() => { for (const [key, value] of Object.entries(saved)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } });
 const user = new User({ name: 'Test', email: 'login@example.test', password: await bcrypt.hash('test-password', 4), role: 'admin' });
 t.mock.method(user, 'save', async () => user);
 t.mock.method(User, 'findOne', async query => query.email === user.email ? user : null);
 let created; t.mock.method(User, 'create', async data => { created = new User(data); return created; });
 const network = globalThis.fetch; let code, failEmail = false;
 t.mock.method(globalThis, 'fetch', async (url, options) => {
  if (url === 'https://api.resend.com/emails') {
   if (failEmail) return { ok: false };
   const mail = JSON.parse(options.body); if (mail.subject.startsWith('Verification')) code = mail.html.match(/\b\d{6}\b/)[0];
   return { ok: true, json: async () => ({ id: 'isolated-mail' }) };
  }
  return network(url, options);
 });
 const server = app.listen(0); await new Promise(resolve => server.once('listening', resolve));
 t.after(() => new Promise(resolve => server.close(resolve)));
 const base = `http://127.0.0.1:${server.address().port}/api/users`;
 const post = (route, body) => fetch(base + route, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
 const login = await post('/auth', { email: user.email, password: 'test-password' });
 assert.equal(login.status, 200); assert.equal((await login.json()).role, 'admin');
 assert.match(login.headers.get('set-cookie'), /HttpOnly/); assert.match(login.headers.get('set-cookie'), /Secure/);
 assert.equal((await post('/auth', { email: user.email, password: 'wrong-password' })).status, 401);
 const email = 'register@example.test';
 const requested = await post('/send-otp', { email }); assert.equal(requested.status, 200);
 const response = await requested.json(); assert.equal(response.otp, undefined); assert.equal(response.debug, undefined);
 const registration = await post('', { name: 'Test', email, password: 'test-password', role: 'admin', otp: code });
 assert.equal(registration.status, 201); assert.equal(created.role, 'user');
 failEmail = true;
 const failed = await post('/send-otp', { email: 'failure@example.test' });
 assert.equal(failed.status, 503); assert.equal((await failed.json()).otp, undefined);
});
