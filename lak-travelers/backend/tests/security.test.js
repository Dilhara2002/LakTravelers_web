import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../app.js';
import { errorHandler } from '../middleware/errorMiddleware.js';
test('internal database errors do not disclose their message', () => {
  const response = { statusCode: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; } };
  const before = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    errorHandler(new Error('private database credentials'), {}, response, () => {});
    assert.equal(response.code, 500);
    assert.equal(response.body.message, 'The service is temporarily unavailable. Please try again.');
    assert.equal(response.body.stack, null);
  } finally { if (before === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = before; }
});
test('Cloudflare preflight works and unrelated origins are rejected', async t => {
  const server = app.listen(0); await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}/api/health`;
  const allowed = await fetch(url, { method: 'OPTIONS', headers: { Origin: 'https://laktravelers-web.pages.dev', 'Access-Control-Request-Method': 'POST' } });
  assert.equal(allowed.status, 204);
  assert.equal(allowed.headers.get('access-control-allow-origin'), 'https://laktravelers-web.pages.dev');
  assert.equal((await fetch(url, { headers: { Origin: 'https://untrusted.example' } })).status, 403);
});
