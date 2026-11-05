import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveApiURL } from '../src/services/apiConfig.js';
test('API URL uses explicit overrides, local development and a deployed fallback', () => {
  assert.equal(resolveApiURL('', 'localhost'), 'http://localhost:5001/api');
  assert.equal(resolveApiURL(undefined, 'laktravelers-web.pages.dev'), 'https://laktravelers-api.onrender.com/api');
  assert.equal(resolveApiURL(' https://example.test/ ', 'localhost'), 'https://example.test/api');
  assert.equal(resolveApiURL('https://example.test/api/', 'localhost'), 'https://example.test/api');
  for (const value of ['/api', 'javascript:alert(1)', 'https://user:secret@example.test', 'https://example.test?key=value']) assert.throws(() => resolveApiURL(value, 'localhost'));
});
