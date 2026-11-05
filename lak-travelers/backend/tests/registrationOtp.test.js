import test from 'node:test';
import assert from 'node:assert/strict';
import nodemailer from 'nodemailer';
import User from '../models/User.js';
import { sendOTP, registerUser } from '../controllers/userController.js';

async function call(handler, body) {
  const res = { statusCode: 200, headers: {}, status(code) { this.statusCode = code; return this; }, set(key, value) { this.headers[key] = value; return this; }, json(data) { this.body = data; return this; } };
  await handler({ body }, res, error => { res.error = error; });
  return res;
}
function setup(t) {
  const keys = ['EMAIL_PROVIDER', 'EMAIL_FROM', 'RESEND_API_KEY'];
  const saved = keys.map(key => process.env[key]);
  Object.assign(process.env, { EMAIL_PROVIDER: 'resend', EMAIL_FROM: 'sender@example.test', RESEND_API_KEY: 'test-only' });
  t.after(() => keys.forEach((key, i) => { if (saved[i] === undefined) delete process.env[key]; else process.env[key] = saved[i]; }));
  t.mock.method(User, 'findOne', async () => null);
  let calls = 0;
  const state = { fail: false, code: null };
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://api.resend.com/emails');
    calls++;
    state.code = JSON.parse(options.body).html.match(/\b\d{6}\b/)[0];
    if (state.fail) throw new Error('private provider detail');
    return { ok: true, json: async () => ({ id: 'test-mail' }) };
  });
  return { state, calls: () => calls };
}
const registration = (email, otp) => ({ name: 'Test', email, password: 'test-password', otp });

test('failed delivery clears OTP and cooldown, allowing a successful retry', async t => {
  const { state, calls } = setup(t);
  const email = 'failure@example.test';
  state.fail = true;
  const failed = await call(sendOTP, { email });
  assert.equal(failed.statusCode, 503);
  assert.match(failed.error.message, /Unable to send/);
  assert.doesNotMatch(failed.error.message, /private provider/);
  const verify = await call(registerUser, registration(email, state.code));
  assert.equal(verify.statusCode, 400);
  assert.match(verify.error.message, /OTP not found/);
  state.fail = false;
  const retry = await call(sendOTP, { email });
  assert.equal(retry.statusCode, 200);
  assert.equal(retry.body.otp, undefined);
  assert.equal(calls(), 2);
});

test('successful request enforces 30 seconds with accurate remaining Retry-After', async t => {
  const { calls } = setup(t);
  let now = 2000000000000;
  t.mock.method(Date, 'now', () => now);
  const email = 'cooldown@example.test';
  assert.equal((await call(sendOTP, { email })).body.retryAfter, 30);
  now += 11000;
  const blocked = await call(sendOTP, { email: email.toUpperCase() });
  assert.equal(blocked.statusCode, 429);
  assert.equal(blocked.headers['Retry-After'], '19');
  assert.equal(blocked.body.retryAfter, 19);
  assert.equal(calls(), 1);
  now += 19000;
  assert.equal((await call(sendOTP, { email })).statusCode, 200);
  assert.equal(calls(), 2);
});

test('in-flight reservation blocks concurrent lookup and slow sends beyond cooldown', async t => {
  setup(t);
  let releaseLookup, entered;
  const waiting = new Promise(resolve => { entered = resolve; });
  t.mock.method(User, 'findOne', () => { entered(); return new Promise(resolve => { releaseLookup = resolve; }); });
  const email = 'concurrent@example.test';
  let now = 2100000000000;
  t.mock.method(Date, 'now', () => now);
  const first = call(sendOTP, { email });
  await waiting;
  assert.equal((await call(sendOTP, { email })).statusCode, 429);
  let releaseSend, sending;
  const sent = new Promise(resolve => { sending = resolve; });
  t.mock.method(globalThis, 'fetch', () => { sending(); return new Promise(resolve => { releaseSend = resolve; }); });
  releaseLookup(null);
  await sent;
  now += 31000;
  assert.equal((await call(sendOTP, { email })).statusCode, 429);
  releaseSend({ ok: false });
  assert.equal((await first).statusCode, 503);
  t.mock.method(User, 'findOne', async () => null);
  t.mock.method(globalThis, 'fetch', async () => ({ ok: true, json: async () => ({ id: 'retry' }) }));
  assert.equal((await call(sendOTP, { email })).statusCode, 200);
});

test('SMTP rejection is a send failure and does not leave a cooldown', async t => {
  setup(t);
  process.env.EMAIL_PROVIDER = 'smtp';
  const keys = ['EMAIL_USER', 'EMAIL_PASS', 'SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD'];
  const saved = keys.map(key => process.env[key]);
  keys.forEach(key => delete process.env[key]);
  Object.assign(process.env, { EMAIL_USER: 'sender@example.test', EMAIL_PASS: 'test-only' });
  t.after(() => keys.forEach((key, i) => { if (saved[i] === undefined) delete process.env[key]; else process.env[key] = saved[i]; }));
  let accepted = false;
  t.mock.method(nodemailer, 'createTransport', () => ({ sendMail: async () => ({ accepted: accepted ? ['smtp@example.test'] : [], rejected: accepted ? [] : ['smtp@example.test'] }) }));
  assert.equal((await call(sendOTP, { email: 'smtp@example.test' })).statusCode, 503);
  accepted = true;
  assert.equal((await call(sendOTP, { email: 'smtp@example.test' })).statusCode, 200);
});

test('lookup errors release reservation and missing config leaves no cooldown', async t => {
  setup(t);
  const email = 'config@example.test';
  t.mock.method(User, 'findOne', async () => { throw new Error('database unavailable'); });
  assert.ok((await call(sendOTP, { email })).error);
  t.mock.method(User, 'findOne', async () => null);
  delete process.env.RESEND_API_KEY;
  assert.equal((await call(sendOTP, { email })).statusCode, 503);
  process.env.RESEND_API_KEY = 'test-only';
  assert.equal((await call(sendOTP, { email })).statusCode, 200);
});

test('successful sends preserve OTP expiry and attempt limits', async t => {
  const { state } = setup(t);
  let now = 2200000000000;
  t.mock.method(Date, 'now', () => now);
  const email = 'expiry@example.test';
  await call(sendOTP, { email });
  now += 10 * 60 * 1000 + 1;
  assert.match((await call(registerUser, registration(email, state.code))).error.message, /expired/);
  await call(sendOTP, { email });
  for (let i = 0; i < 5; i++) assert.match((await call(registerUser, registration(email, '000000'))).error.message, /Invalid OTP/);
  assert.match((await call(registerUser, registration(email, state.code))).error.message, /Too many attempts/);
});
