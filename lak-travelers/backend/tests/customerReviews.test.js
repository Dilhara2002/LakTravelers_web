import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import { validateReview } from '../routes/customerReviewRoutes.js';
import { CustomerReview, CustomerReviewImage } from '../models/CustomerReview.js';
import User from '../models/User.js';
import { readFile } from 'node:fs/promises';

test('reviews validate ratings, plain text, honeypot and image limits', () => {
 const body = { name: 'Guest', comment: 'A lovely journey.', rating: '3' };
 assert.equal(validateReview(body, []).rating, 3);
 const png = { size: 9, buffer: Buffer.from([137,80,78,71,13,10,26,10,0]), mimetype: 'image/png' };
 assert.equal(validateReview(body, Array(5).fill(png)).rating, 3);
 for (const rating of [0, 6, 1.5, '', 'NaN']) assert.throws(() => validateReview({ ...body, rating }, []));
 for (const patch of [{name:' '}, {comment:'short'}, {comment:'<script>alert(1)</script>'}, {website:'spam'}]) assert.throws(() => validateReview({...body,...patch}, []));
 assert.throws(() => validateReview(body, Array(6).fill({})));
 assert.throws(() => validateReview(body, [{size:6*1024*1024,buffer:Buffer.from('bad'),mimetype:'image/png'}]));
 assert.throws(() => validateReview(body, [{size:4,buffer:Buffer.from('bad'),mimetype:'image/jpeg'}]));
});

test('multipart submission, moderation authorization and photo privacy work through HTTP (isolated model doubles)', async t => {
 const previousSecret = process.env.JWT_SECRET;
 process.env.JWT_SECRET = 'isolated-review-test-secret';
 t.after(() => { if (previousSecret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = previousSecret; });
 const records = [], images = [];
 t.mock.method(CustomerReview.prototype, 'save', async function() { if (!records.some(r => String(r._id) === String(this._id))) records.push(this); return this; });
 t.mock.method(CustomerReviewImage, 'create', async data => { const doc = new CustomerReviewImage(data); images.push(doc); return doc; });
 t.mock.method(CustomerReview, 'find', query => ({ select() { return this; }, sort() { return this; }, limit() { return this; }, lean() { return Promise.resolve(records.filter(r => query.status?.$in ? query.status.$in.includes(r.status) : r.status === query.status)); } }));
 t.mock.method(CustomerReviewImage, 'findById', async id => images.find(i => String(i._id) === id));
 t.mock.method(CustomerReview, 'findById', id => ({ select: async () => records.find(r => String(r._id) === String(id)), then(resolve) { return Promise.resolve(records.find(r => String(r._id) === String(id))).then(resolve); } }));
 t.mock.method(CustomerReview, 'updateOne', async () => ({}));
 t.mock.method(CustomerReview, 'findOneAndUpdate', (query, data) => ({ select: async () => { const r = records.find(r => String(r._id) === String(query._id) && r.status === query.status); if (!r) return null; Object.assign(r, data.$set); return r; } }));
 t.mock.method(User, 'findById', id => ({ select: async () => ({ _id:id, role:id === 'admin-test' ? 'admin' : 'user' }) }));
 const server = app.listen(0);
 await new Promise(resolve => server.once('listening', resolve));
 const url = `http://127.0.0.1:${server.address().port}/api/customer-reviews`;
 try {
  const body = new FormData(); body.set('name','Test guest'); body.set('rating','4'); body.set('comment','A thoughtful journey through Sri Lanka.');
  const photo = await readFile(new URL('../../frontend/src/assets/toyota-axio.jpg',import.meta.url));
  body.append('photos',new Blob([photo],{type:'image/jpeg'}),'travel.jpg');
  const result = await fetch(url,{method:'POST',body}); assert.equal(result.status,201); assert.equal(records[0].status,'pending'); assert.equal(images.length,1);
  assert.equal((await (await fetch(url)).json()).length,0);
  const photoUrl = `${url}/photos/${images[0]._id}`;
  assert.equal((await fetch(photoUrl)).status,404);
  assert.equal((await fetch(`${url}/moderation`)).status,401);
  const auth = role => ({Authorization:`Bearer ${jwt.sign({userId:role},process.env.JWT_SECRET,{issuer:'lak-travelers-api',audience:'lak-travelers-client'})}`});
  assert.equal((await fetch(`${url}/moderation`,{headers:auth('user-test')})).status,403);
  assert.equal((await fetch(`${url}/moderation`,{headers:auth('admin-test')})).status,200);
  assert.equal((await fetch(`${url}/moderation/photos/${images[0]._id}`,{headers:auth('admin-test')})).status,200);
  assert.equal((await fetch(`${url}/${records[0]._id}/status`,{method:'PATCH',headers:{...auth('admin-test'),'Content-Type':'application/json'},body:JSON.stringify({status:'approved'})})).status,200);
  assert.equal((await (await fetch(url)).json()).length,1);
  const publicPhoto = await fetch(photoUrl); assert.equal(publicPhoto.status,200); assert.equal(publicPhoto.headers.get('content-type'),'image/jpeg');
  assert.deepEqual(Buffer.from(await publicPhoto.arrayBuffer()),photo);
  const draft = new CustomerReview({ name: '', comment: '', status: 'draft', rating: 5 }); records.push(draft);
  await draft.validate();
  const change = (path, data, role = 'admin-test') => fetch(`${url}/${draft._id}/${path}`, { method: 'PATCH', headers: {...auth(role), 'Content-Type':'application/json'}, body: JSON.stringify(data) });
  assert.equal((await change('status', {status:'approved'})).status,400);
  assert.equal((await change('details', {name:'Genuine name',comment:'A real customer experience.',rating:5}, 'user-test')).status,403);
  assert.equal((await change('details', {name:'Genuine name',comment:'A real customer experience.',rating:5})).status,200);
  assert.equal(draft.status,'draft');
  assert.equal((await change('status', {status:'approved'})).status,200);
  const invalid = new FormData(); invalid.set('name','Guest'); invalid.set('rating','4'); invalid.set('comment','Another journey.'); invalid.append('photos',new Blob(['<script>bad</script>'],{type:'image/png'}),'fake.png');
  assert.equal((await fetch(url,{method:'POST',body:invalid})).status,400);
 } finally { await new Promise(resolve => server.close(resolve)); }
});

test('central WhatsApp helper identifies the website, page and both vehicles', async () => {
 const { whatsappUrl } = await import('../../frontend/src/services/features.js');
 for (const vehicle of ['Toyota Axio 2016 Hybrid', 'Suzuki Wagon R Stingray 2018 Hybrid']) {
  const url = new URL(whatsappUrl({vehicle}));
  assert.equal(url.pathname, '/94723201365');
  assert.match(url.searchParams.get('text'), /LakTravelers \| Source: Website \| Service: Vehicle Booking/);
  assert.ok(url.searchParams.get('text').includes(`Vehicle: ${vehicle}`));
 }
 assert.match(new URL(whatsappUrl({pathname:'/'})).searchParams.get('text'), /Page: Home/);
 assert.match(new URL(whatsappUrl({pathname:'/vehicles/toyota-axio-2016-hybrid'})).searchParams.get('text'), /Vehicle: Toyota Axio 2016 Hybrid/);
});
