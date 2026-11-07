import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../app.js';
import { CustomerReview } from '../models/CustomerReview.js';

test('displayDate is optional, typed as Date, and independent of submission timestamps', async () => {
 const review = new CustomerReview({ name: 'Fixture', comment: 'Isolated schema verification.', rating: 5, createdAt: new Date('2026-11-06T00:00:00Z') });
 await review.validate();
 assert.equal(review.displayDate, undefined);
 review.displayDate = '2026-10-15T00:00:00Z';
 await review.validate();
 assert.ok(review.displayDate instanceof Date);
 assert.equal(review.createdAt.toISOString(), '2026-11-06T00:00:00.000Z');
 review.displayDate = 'invalid';
 await assert.rejects(review.validate());
});
test('public API selects displayDate and returns refreshed values without changing createdAt', async t => {
 const fixture = { name: 'Fixture', createdAt: new Date('2026-11-06T00:00:00Z'), displayDate: new Date('2026-10-15T00:00:00Z') };
 t.mock.method(CustomerReview, 'find', query => {
  assert.deepEqual(query, { status: 'approved' });
  return { select(fields) { assert.ok(fields.split(' ').includes('displayDate')); return this; }, sort() { return this; }, limit() { return this; }, lean: async () => [fixture] };
 });
 const server = app.listen(0);
 await new Promise(resolve => server.once('listening', resolve));
 t.after(() => new Promise(resolve => server.close(resolve)));
 const url = `http://127.0.0.1:${server.address().port}/api/customer-reviews`;
 const first = await fetch(url);
 assert.equal(first.status, 200); assert.equal(first.headers.get('cache-control'), 'no-store');
 assert.equal((await first.json())[0].displayDate, '2026-10-15T00:00:00.000Z');
 fixture.displayDate = new Date('2026-10-16T00:00:00Z');
 const updated = (await (await fetch(url)).json())[0];
 assert.equal(updated.displayDate, '2026-10-16T00:00:00.000Z');
 assert.equal(updated.createdAt, '2026-11-06T00:00:00.000Z');
});
