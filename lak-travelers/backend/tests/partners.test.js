import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import User from '../models/User.js';
import { PartnerApplication, PartnerDocument, PartnerProfile, PartnerSession, PartnerToken } from '../models/Partner.js';
import { digest } from '../routes/partnerRoutes.js';
import { validateDetails, validateUpload, checkSubmission, checkTransition } from '../utils/partnerValidation.js';
import { partnerCategories, MAX_FILE_SIZE } from '../../shared/partnerFields.mjs';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a6xkAAAAASUVORK5CYII=', 'base64');
function details(kind) {
  const value = Object.fromEntries(partnerCategories[kind].fields.map(f => [f.key, f.options?.[0] || (f.type === 'date' ? (f.key.endsWith('Issued') ? '2020-01-01' : '2090-12-31') : f.type === 'number' ? (f.key === 'year' ? '2020' : '4') : 'Example')]));
  return { ...value, email: 'partner@example.test', whatsapp: '+94762898945', nic: '199012345678' };
}
test('category validation requires every field, verifies dates and prevents unknown/privileged fields', () => {
  for (const kind of Object.keys(partnerCategories)) {
    assert.doesNotThrow(() => validateDetails(kind, details(kind), true));
    assert.throws(() => validateDetails(kind, {}, true), /required/);
    assert.throws(() => validateDetails(kind, { ...details(kind), status: 'Approved' }), /Unsupported/);
  }
  assert.throws(() => validateDetails('guide', { ...details('guide'), licenceExpiry: '2020-02-31' }), /Invalid/);
  assert.throws(() => validateDetails('guide', { ...details('guide'), licenceExpiry: '2020-01-01' }, true), /expired/);
  assert.throws(() => validateDetails('vehicle', { ...details('vehicle'), seats: '0' }), /Invalid/);
  assert.throws(() => validateDetails('__proto__', {}), /Invalid/);
});
test('uploads inspect signatures and MIME, enforce size, reject HTML and PDFs in photo slots', () => {
  assert.equal(validateUpload({ buffer: png, size: png.length, mimetype: 'image/png' }, 'nicFront').extension, 'png');
  assert.throws(() => validateUpload({ buffer: png, size: MAX_FILE_SIZE + 1, mimetype: 'image/png' }, 'nicFront'), /5 MB/);
  assert.throws(() => validateUpload({ buffer: png, size: png.length, mimetype: 'application/pdf' }, 'nicFront'), /contents/);
  const html = Buffer.from('<script>alert(1)</script>');
  assert.throws(() => validateUpload({ buffer: html, size: html.length, mimetype: 'image/png' }, 'nicFront'), /contents/);
  const pdf = Buffer.from('%PDF-1.7\nexample\n%%EOF');
  assert.equal(validateUpload({ buffer: pdf, size: pdf.length, mimetype: 'application/pdf' }, 'nicFront').extension, 'pdf');
  assert.throws(() => validateUpload({ buffer: pdf, size: pdf.length, mimetype: 'application/pdf' }, 'profilePhoto'), /photos/);
});
test('submission and approval fail closed for missing/expired documents and invalid transitions', () => {
  const application = { category: 'guide', details: details('guide'), documents: {}, status: 'Draft' };
  assert.throws(() => checkSubmission(application), /document is required/);
  for (const slot of partnerCategories.guide.documents) application.documents[slot] = 'document-id';
  assert.throws(() => checkTransition(application, 'Approved', 'Checked', true), /not allowed/);
  application.status = 'Under Review';
  assert.throws(() => checkTransition(application, 'Approved', 'Checked', false), /Manually verify/);
  assert.doesNotThrow(() => checkTransition(application, 'Approved', 'Verified with issuing authority', true));
  application.details.licenceExpiry = '2020-01-01';
  assert.throws(() => checkTransition(application, 'Approved', 'Checked', true), /expired/);
});

// In-memory persistence adapter for HTTP workflow tests. No MongoDB or external email is contacted.
// Real Mongoose validation, bcrypt, session middleware, uploads and route handlers are exercised.
function memoryModels(t) {
  const stores = new Map();
  function get(obj, key) { return key.split('.').reduce((v, k) => v instanceof Map ? v.get(k) : v?.[k], obj); }
  const equal = (a, b) => a?.toString() === b?.toString();
  function matches(doc, filter) {
    return Object.entries(filter).every(([key, expected]) => {
      if (key === '$or') return expected.some(f => matches(doc, f));
      if (key === 'history._id') return doc.history.some(h => equal(h._id, expected));
      const actual = get(doc, key);
      if (expected && typeof expected === 'object' && !(expected instanceof mongoose.Types.ObjectId) && !(expected instanceof Date)) {
        return Object.entries(expected).every(([op, val]) => op === '$gt' ? actual > val : op === '$lte' ? actual <= val : op === '$ne' ? !equal(actual, val) : op === '$regex' ? new RegExp(val, expected.$options).test(actual) : op === '$options');
      }
      return equal(actual, expected);
    });
  }
  for (const Model of [User, PartnerProfile, PartnerSession, PartnerToken, PartnerApplication, PartnerDocument]) {
    const store = new Map(); stores.set(Model, store);
    const clone = doc => doc ? new Model(doc.toObject()) : null;
    const find = filter => [...store.values()].filter(d => matches(d, filter));
    function query(values) {
      return { select() { return this; }, sort() { return this; }, skip(n) { values = values.slice(n); return this; }, limit(n) { values = values.slice(0, n); return this; }, then(resolve, reject) { return Promise.resolve(Array.isArray(values) ? values.map(clone) : clone(values)).then(resolve, reject); } };
    }
    t.mock.method(Model, 'find', filter => query(find(filter)));
    t.mock.method(Model, 'findOne', filter => query(find(filter)[0]));
    t.mock.method(Model, 'findById', value => query(store.get(String(value))));
    t.mock.method(Model, 'exists', async filter => find(filter)[0] ? { _id: find(filter)[0]._id } : null);
    t.mock.method(Model, 'countDocuments', async filter => find(filter).length);
    t.mock.method(Model.prototype, 'save', async function () {
      await this.validate();
      const old = store.get(String(this._id));
      if (Model === PartnerApplication && old && old.__v !== this.__v) throw Object.assign(new Error('Conflict'), { name: 'VersionError' });
      this.__v = old ? (old.__v || 0) + 1 : 0;
      if (Model === User && this.isModified('password') && this.password && !this.password.startsWith('$2')) this.password = await bcrypt.hash(this.password, 4);
      store.set(String(this._id), clone(this)); return this;
    });
    t.mock.method(Model, 'create', async value => { const doc = new Model(value); return doc.save(); });
    t.mock.method(Model, 'deleteOne', async filter => { const doc = find(filter)[0]; if (doc) store.delete(String(doc._id)); return { deletedCount: doc ? 1 : 0 }; });
    t.mock.method(Model, 'deleteMany', async filter => { for (const doc of find(filter)) store.delete(String(doc._id)); });
    t.mock.method(Model, 'findOneAndDelete', async filter => { const doc = find(filter)[0]; if (doc) store.delete(String(doc._id)); return clone(doc); });
    function update(filter, changes, options = {}) {
      let doc = find(filter)[0]; const old = clone(doc);
      if (!doc && options.upsert) { doc = new Model({ ...filter, ...changes.$setOnInsert }); store.set(String(doc._id), doc); }
      if (!doc) return null;
      for (const [key, value] of Object.entries(changes.$set || {})) {
        if (key === 'history.$.notification') doc.history.id(filter['history._id']).notification = value;
        else doc.set(key, value);
      }
      for (const [key, value] of Object.entries(changes.$push || {})) doc[key].push(value);
      return options.new ? clone(doc) : old;
    }
    t.mock.method(Model, 'findOneAndUpdate', async (filter, changes, options) => update(filter, changes, options));
    t.mock.method(Model, 'updateOne', async (filter, changes) => { update(filter, changes); return { modifiedCount: 1 }; });
  }
  return stores;
}
test('HTTP partner onboarding, private uploads, corrections, admin decisions, expiry, sessions and email failure', async t => {
  const stores = memoryModels(t);
  const keys = ['EMAIL_PROVIDER', 'RESEND_API_KEY', 'EMAIL_FROM', 'JWT_SECRET'];
  const saved = keys.map(key => process.env[key]);
  Object.assign(process.env, { EMAIL_PROVIDER: 'resend', RESEND_API_KEY: 'test-only', EMAIL_FROM: 'test@example.test', JWT_SECRET: 'test-secret-not-for-production' });
  t.after(() => keys.forEach((key, i) => { if (saved[i] === undefined) delete process.env[key]; else process.env[key] = saved[i]; }));
  const realFetch = globalThis.fetch; const sent = []; let emailFails = false;
  t.mock.method(globalThis, 'fetch', (url, opts) => {
    if (String(url).startsWith('https://api.resend.com/')) {
      sent.push(JSON.parse(opts.body));
      return Promise.resolve({ ok: !emailFails, json: async () => ({ id: 'test-message' }) });
    }
    return realFetch(url, opts);
  });
  const server = app.listen(0); await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}/api/partners`;
  async function request(path, method = 'GET', body, cookie, bearer, extra = {}) {
    const headers = { Origin: 'http://localhost:5173', 'X-Requested-With': 'LakTravelersPartner', ...(cookie ? { Cookie: cookie } : {}), ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}), ...extra };
    if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
    const response = await realFetch(base + path, { method, headers, body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined });
    const data = response.headers.get('content-type')?.includes('application/json') ? await response.json() : Buffer.from(await response.arrayBuffer());
    return { response, data, status: response.status, cookie: response.headers.get('set-cookie')?.split(';')[0] };
  }
  assert.equal((await request('/applications')).status, 401);
  assert.equal((await request('/auth/login', 'POST', {}, null, null, { 'X-Requested-With': '' })).status, 403);
  assert.equal((await request('/auth/login', 'POST', {}, null, null, { Origin: 'https://evil.test' })).status, 403);
  const credentials = { name: 'Partner', email: 'partner@example.test', password: 'strong-password-123', consent: true };
  assert.equal((await request('/auth/register', 'POST', { ...credentials, password: 'weak' })).status, 400);
  assert.equal((await request('/auth/register', 'POST', credentials)).status, 201);
  const user = [...stores.get(User).values()][0];
  assert.notEqual(user.password, credentials.password);
  const code = sent.at(-1).text.match(/[a-f0-9]{64}/)[0];
  assert.notEqual([...stores.get(PartnerToken).values()][0].hash, code);
  assert.equal((await request('/auth/login', 'POST', { ...credentials, password: 'incorrect' })).status, 401);
  const login = await request('/auth/login', 'POST', credentials); assert.equal(login.status, 200);
  const cookie = login.cookie; assert.match(login.response.headers.get('set-cookie'), /HttpOnly/);
  assert.equal((await request('/applications', 'POST', { category: 'guide' }, cookie)).status, 403);
  assert.equal((await request('/auth/verify', 'POST', { token: code }, cookie)).status, 200);
  assert.equal((await request('/auth/verify', 'POST', { token: code }, cookie)).status, 400);
  assert.equal((await request('/auth/me', 'GET', null, cookie)).data.verified, true);
  assert.equal((await request('/applications', 'POST', { category: '__proto__' }, cookie)).status, 400);
  let application = (await request('/applications', 'POST', { category: 'guide' }, cookie)).data;
  const path = `/applications/${application._id}`;
  assert.equal((await request(`${path}/submit`, 'POST', { version: application.__v, consent: true }, cookie)).status, 400);
  const savedDraft = await request(path, 'PUT', { details: details('guide'), version: application.__v }, cookie);
  assert.equal(savedDraft.status, 200); application = savedDraft.data;
  assert.equal((await request(path, 'PUT', { details: details('guide'), version: 0 }, cookie)).status, 409);
  const other = await User.create({ name: 'Other', email: 'other@example.test', password: 'other-password-123' });
  await PartnerProfile.create({ user: other._id, consentAt: new Date(), verifiedEmail: other.email });
  const otherRaw = randomBytes(32).toString('hex');
  await PartnerSession.create({ user: other._id, hash: digest(otherRaw), credentialHash: digest(other.password), expiresAt: new Date(Date.now() + 60000) });
  const otherCookie = `lak_partner_session=${otherRaw}`;
  assert.equal((await request(path, 'PUT', { details: {}, version: application.__v }, otherCookie)).status, 404);
  for (const slot of partnerCategories.guide.documents) {
    const form = new FormData(); form.append('version', String(application.__v)); form.append('file', new Blob([png], { type: 'image/png' }), '../../identity.png');
    const uploaded = await request(`${path}/documents/${slot}`, 'POST', form, cookie); assert.equal(uploaded.status, 201); application = uploaded.data;
  }
  const previousDoc = application.documents.profilePhoto;
  const replace = new FormData(); replace.append('version', String(application.__v)); replace.append('file', new Blob([png], { type: 'image/png' }), 'replacement.png');
  application = (await request(`${path}/documents/profilePhoto`, 'POST', replace, cookie)).data;
  assert.notEqual(application.documents.profilePhoto, previousDoc);
  assert.equal(stores.get(PartnerDocument).has(previousDoc), false);
  const file = await request(`${path}/documents/nicFront`, 'GET', null, cookie);
  assert.equal(file.status, 200); assert.deepEqual(file.data, png); assert.match(file.response.headers.get('content-disposition'), /attachment; filename="[a-f0-9]+\.png"/);
  assert.equal(file.response.headers.get('cache-control'), 'no-store');
  assert.equal((await request(`${path}/documents/nicFront`, 'GET', null, otherCookie)).status, 404);
  assert.equal((await request(`${path}/documents/nicFront`)).status, 401);
  assert.equal((await request('/admin/applications', 'GET', null, cookie)).status, 401);
  const userBearer = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { issuer: 'lak-travelers-api', audience: 'lak-travelers-client' });
  assert.equal((await request('/admin/applications', 'GET', null, null, userBearer)).status, 403);
  const admin = await User.create({ name: 'Admin', email: 'admin@example.test', password: 'admin-password-123', role: 'admin' });
  const bearer = jwt.sign({ userId: admin._id }, process.env.JWT_SECRET, { issuer: 'lak-travelers-api', audience: 'lak-travelers-client' });
  const submitted = await request(`${path}/submit`, 'POST', { version: application.__v, consent: true }, cookie);
  assert.equal(submitted.status, 200); application = submitted.data.application; assert.equal(application.status, 'Submitted');
  assert.equal((await request(path, 'PUT', { details: details('guide'), version: application.__v }, cookie)).status, 409);
  const adminPath = `/admin/applications/${application._id}`;
  async function decision(status, licencesVerified = false) {
    return request(`${adminPath}/decision`, 'POST', { status, version: application.__v, note: 'Checked with issuing authority', licencesVerified }, null, bearer);
  }
  assert.equal((await decision('Approved', true)).status, 409);
  application = (await decision('Changes Requested')).data.application;
  assert.equal(application.status, 'Changes Requested');
  application = (await request(`${path}/submit`, 'POST', { version: application.__v, consent: true }, cookie)).data.application;
  application = (await decision('Under Review')).data.application;
  assert.equal((await decision('Approved')).status, 400);
  emailFails = true;
  const approval = await decision('Approved', true); assert.equal(approval.status, 200); assert.equal(approval.data.notification, 'failed');
  application = approval.data.application; assert.equal(application.selfDriveAuthorized, false); assert.ok(application.licenceVerifiedAt);
  assert.equal((await request('/applications', 'GET', null, cookie)).data.find(a => a._id === application._id).status, 'Approved');
  assert.equal((await request('/admin/applications?status=Approved', 'GET', null, null, bearer)).data.total, 1);
  const eventId = application.history.at(-1)._id; emailFails = false;
  assert.equal((await request(`${adminPath}/notifications/${eventId}/retry`, 'POST', {}, null, bearer)).data.notification, 'sent');
  assert.equal((await request(`${adminPath}/documents/nicFront`, 'GET', null, null, bearer)).status, 200);
  assert.ok((await request(adminPath, 'GET', null, null, bearer)).data.history.some(e => e.action === 'Document accessed'));
  application = (await decision('Suspended')).data.application; assert.equal(application.status, 'Suspended');
  application = (await decision('Under Review')).data.application;
  application = (await decision('Rejected')).data.application; assert.equal(application.status, 'Rejected');
  // Exercise full submission/review/status retrieval for the other form types and multiple vehicles.
  for (const category of ['driver', 'vehicle', 'vehicle']) {
    const created = await request('/applications', 'POST', { category, status: 'Approved', owner: admin._id }, cookie);
    assert.equal(created.status, 201);
    let item = created.data;
    assert.equal(item.status, 'Draft');
    assert.equal(item.owner, String(user._id));
    const itemPath = `/applications/${item._id}`;
    const saved = await request(itemPath, 'PUT', { version: item.__v, details: details(category) }, cookie);
    assert.equal(saved.status, 200); item = saved.data;
    for (const slot of partnerCategories[category].documents) {
      const form = new FormData(); form.append('version', String(item.__v));
      form.append('file', new Blob([png], { type: 'image/png' }), 'private.png');
      const uploaded = await request(`${itemPath}/documents/${slot}`, 'POST', form, cookie);
      assert.equal(uploaded.status, 201); item = uploaded.data;
      assert.equal((await request(`${itemPath}/documents/${slot}`, 'GET', null, otherCookie)).status, 404);
    }
    const submitted = await request(`${itemPath}/submit`, 'POST', { version: item.__v, consent: true }, cookie);
    assert.equal(submitted.status, 200); item = submitted.data.application;
    for (const status of ['Under Review', 'Approved']) {
      const reviewed = await request(`/admin/applications/${item._id}/decision`, 'POST', {
        version: item.__v, status, note: 'Manually verified test documents', licencesVerified: true,
      }, null, bearer);
      assert.equal(reviewed.status, 200); item = reviewed.data.application;
    }
    const visible = (await request('/applications', 'GET', null, cookie)).data.find(a => a._id === item._id);
    assert.equal(visible.status, 'Approved');
    assert.equal(visible.selfDriveAuthorized, false);
    assert.equal(Object.keys(visible.documents).length, partnerCategories[category].documents.length);
  }
  assert.equal((await request('/applications', 'GET', null, cookie)).data.length, 4);
  assert.equal((await request('/auth/forgot', 'POST', { email: credentials.email })).status, 200);
  const resetCode = sent.at(-1).text.match(/[a-f0-9]{64}/)[0];
  assert.equal((await request('/auth/reset', 'POST', { email: credentials.email, password: 'changed-password-123', token: resetCode })).status, 200);
  assert.equal((await request('/auth/me', 'GET', null, cookie)).status, 401);
  assert.equal((await request('/auth/reset', 'POST', { email: credentials.email, password: 'changed-again-123', token: resetCode })).status, 400);
  const relogin = await request('/auth/login', 'POST', { ...credentials, password: 'changed-password-123' }); assert.equal(relogin.status, 200);
  assert.equal((await request('/auth/logout', 'POST', {}, relogin.cookie)).status, 200);
  assert.equal((await request('/auth/me', 'GET', null, relogin.cookie)).status, 401);
  const otherSession = [...stores.get(PartnerSession).values()].find(s => String(s.user) === String(other._id));
  otherSession.expiresAt = new Date(0);
  assert.equal((await request('/auth/me', 'GET', null, otherCookie)).status, 401);
  let limited;
  for (let i = 0; i < 21; i++) limited = await request('/auth/login', 'POST', { ...credentials, password: 'incorrect' });
  assert.equal(limited.status, 429);
  assert.ok(limited.response.headers.get('retry-after'));
});
