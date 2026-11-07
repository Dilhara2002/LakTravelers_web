import process from 'node:process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { reviewDate } from '../src/services/reviewDate.js';

test('optional trip date takes precedence without changing the source timestamps', () => {
 const review = Object.freeze({ displayDate: '2026-10-15T00:00:00.000Z', createdAt: '2026-11-06T20:00:00.000Z' });
 assert.deepEqual(reviewDate(review), { label: 'Review date', dateTime: review.displayDate, text: '15 Oct 2026' });
});
test('older reviews and invalid optional dates safely fall back to submission date', () => {
 for (const displayDate of [undefined, null, '', 'invalid']) {
  assert.deepEqual(reviewDate({ displayDate, createdAt: '2026-11-06T23:59:00Z' }), { label: 'Review submitted', dateTime: '2026-11-06T23:59:00.000Z', text: '6 Nov 2026' });
 }
 assert.equal(reviewDate({ createdAt: 'invalid' }), null);
});
test('calendar date is identical west and east of UTC', () => {
 const original = process.env.TZ;
 try {
  for (const zone of ['America/Los_Angeles', 'Asia/Colombo', 'Pacific/Kiritimati']) {
   process.env.TZ = zone;
   assert.equal(reviewDate({ displayDate: '2026-10-15T00:00:00Z' }).text, '15 Oct 2026');
  }
 } finally { if (original === undefined) delete process.env.TZ; else process.env.TZ = original; }
});
