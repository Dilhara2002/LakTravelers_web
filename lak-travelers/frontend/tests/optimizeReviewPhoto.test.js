import test from 'node:test';
import assert from 'node:assert/strict';
import { optimizeReviewPhoto } from '../src/services/optimizeReviewPhoto.js';

function browser(t, { width = 4000, height = 3000, outputSize = 300000, encodeFails = false } = {}) {
 const originals = { createImageBitmap: globalThis.createImageBitmap, document: globalThis.document };
 let closed = false;
 const canvas = { width: 0, height: 0, getContext: () => ({ fillRect() {}, drawImage() {} }), toBlob(callback, type, quality) { assert.equal(type, 'image/jpeg'); assert.equal(quality, 0.82); queueMicrotask(() => callback(encodeFails ? null : new Blob([new Uint8Array(outputSize)], { type }))); } };
 globalThis.createImageBitmap = async (_file, options) => { assert.equal(options.imageOrientation, 'from-image'); return { width, height, close() { closed = true; } }; };
 globalThis.document = { createElement: () => canvas };
 t.after(() => { for (const [key, value] of Object.entries(originals)) { if (value === undefined) delete globalThis[key]; else globalThis[key] = value; } });
 return { canvas, closed: () => closed };
}
test('large landscape images shrink to 1600px and retain a valid JPEG file', async t => {
 const { canvas, closed } = browser(t);
 const output = await optimizeReviewPhoto(new File([new Uint8Array(2000000)], 'trip.png', { type: 'image/png' }));
 assert.equal(canvas.width, 1600); assert.equal(canvas.height, 1200);
 assert.equal(output.size, 300000); assert.equal(output.type, 'image/jpeg'); assert.equal(output.name, 'trip.jpg'); assert.ok(closed());
});
test('portrait images preserve orientation and aspect ratio', async t => {
 const { canvas } = browser(t, { width: 3000, height: 4000 });
 await optimizeReviewPhoto(new File([new Uint8Array(2000000)], 'phone.jpg', { type: 'image/jpeg' }));
 assert.equal(canvas.width, 1200); assert.equal(canvas.height, 1600);
});
test('small files are not enlarged in bytes or dimensions', async t => {
 browser(t, { width: 300, height: 200 });
 const file = new File(['small'], 'small.webp', { type: 'image/webp' });
 assert.equal(await optimizeReviewPhoto(file), file);
});
test('unsupported and oversized inputs reject; encoding failures are explicit and release resources', async t => {
 const { closed } = browser(t, { encodeFails: true });
 await assert.rejects(optimizeReviewPhoto(new File(['bad'], 'bad.svg', { type: 'image/svg+xml' })), /JPG/);
 await assert.rejects(optimizeReviewPhoto(new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'big.jpg', { type: 'image/jpeg' })), /5 MB/);
 await assert.rejects(optimizeReviewPhoto(new File(['photo'], 'trip.jpg', { type: 'image/jpeg' })), /Could not prepare trip.jpg/);
 assert.ok(closed());
});
