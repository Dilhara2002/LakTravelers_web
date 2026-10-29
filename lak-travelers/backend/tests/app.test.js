import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../app.js';

test('health endpoint returns a safe status response', async () => {
  const server = app.listen(0);
  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'ok' });
    assert.ok(response.headers.get('x-content-type-options'));
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('unknown API endpoints return consistent JSON', async () => {
  const server = app.listen(0);
  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/does-not-exist`);
    const body = await response.json();
    assert.equal(response.status, 404);
    assert.equal(body.success, false);
    assert.match(body.message, /Not Found/);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('AI endpoint fails safely when Gemini is not configured', async () => {
  const previousKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  const server = app.listen(0);
  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Plan a trip to Kandy' }),
    });
    const body = await response.json();
    assert.equal(response.status, 503);
    assert.equal(body.success, false);
    assert.match(body.reply, /not configured/i);
  } finally {
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousKey;
    await new Promise((resolve) => server.close(resolve));
  }
});
