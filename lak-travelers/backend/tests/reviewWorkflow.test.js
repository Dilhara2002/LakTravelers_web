import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { readFile } from 'node:fs/promises';
import app from '../app.js';
import User from '../models/User.js';
import { CustomerReview, CustomerReviewImage } from '../models/CustomerReview.js';
import { reviewEmail, reviewEmailConfig } from '../utils/reviewNotification.js';

test('email has real content, both confirmation links, safe HTML and plain text', () => {
 const review = { _id:'123', name:'Guest & family', rating:3, comment:'Travel <experience>', images:['photo'], createdAt:new Date('2026-10-28T10:00:00Z') };
 const mail = reviewEmail(review, {base:'https://travel.example', from:'from@example.test', to:'admin@example.test'});
 assert.equal(mail.subject,'New LakTravelers Customer Review - Approval Required');
 assert.match(mail.html,/Guest &amp; family/); assert.match(mail.html,/Travel &lt;experience&gt;/);
 assert.match(mail.html,/APPROVE REVIEW/); assert.match(mail.html,/REJECT REVIEW/);
 assert.match(mail.html,/A Brand of IDW \(Pvt\) Ltd/); assert.match(mail.text,/Rating: 3\/5/);
 assert.match(mail.text,/action=approve/); assert.match(mail.text,/action=reject/);
 assert.throws(() => reviewEmailConfig({}), err => err.missing.includes('ADMIN_REVIEW_EMAIL'));
});

test('real MongoDB + HTTP: submit, email, GET safety, approve/reject, replay, images and retry', { skip: process.env.RUN_REVIEW_DB_TEST !== '1' }, async t => {
 const testDb = `lak_review_verification_${Date.now()}`;
 const saved = Object.fromEntries(['PUBLIC_APP_URL','ADMIN_REVIEW_EMAIL','JWT_SECRET'].map(k => [k,process.env[k]]));
 process.env.PUBLIC_APP_URL='https://review-test.example'; process.env.ADMIN_REVIEW_EMAIL='admin@example.test'; process.env.JWT_SECRET='isolated-integration-secret';
 const sent=[]; let failEmail=false;
 t.mock.method(nodemailer,'createTransport',() => ({ async sendMail(mail) { if(failEmail) throw Object.assign(new Error('private SMTP details must not be logged'),{code:'EAUTH'}); sent.push(mail); return {accepted:[mail.to],rejected:[]}; } }));
 t.mock.method(User,'findById',id => ({ select:async () => ({_id:id, role:id === 'admin-test' ? 'admin' : 'user'}) }));
 let server;
 try {
  await mongoose.connect(process.env.MONGO_URI,{dbName:testDb,serverSelectionTimeoutMS:15000});
  server=app.listen(0,'127.0.0.1'); await new Promise(resolve => server.once('listening',resolve));
  const base=`http://127.0.0.1:${server.address().port}/api/customer-reviews`;
  const auth=role => ({Authorization:`Bearer ${jwt.sign({userId:role},process.env.JWT_SECRET,{issuer:'lak-travelers-api',audience:'lak-travelers-client'})}`});
  const headers={...auth('admin-test'),'Content-Type':'application/json'};
  const data=await readFile(new URL('../../frontend/src/assets/toyota-axio.jpg',import.meta.url));
  async function submit(name,photo=false) {
   const body=new FormData(); body.set('name',name);body.set('rating','4');body.set('comment','Isolated automated verification, never a public testimonial.');
   if(photo)body.append('photos',new Blob([data],{type:'image/jpeg'}),'travel.jpg');
   const result=await fetch(base,{method:'POST',body});assert.equal(result.status,201);
   return CustomerReview.findOne({name});
  }
  const first=await submit('Verification approval',true);
  assert.equal(first.status,'pending'); assert.equal(first.notification.status,'sent');assert.equal(sent.length,1);
  assert.match(sent[0].text,/Verification approval/); assert.ok(sent[0].html.includes(`${first._id}/decision?action=approve`));
  assert.equal((await (await fetch(base)).json()).length,0);
  assert.equal((await fetch(`${base}/photos/${first.images[0]}`)).status,404);
  const detail=await fetch(`${base}/moderation/${first._id}`,{headers});assert.equal(detail.status,200);
  assert.equal((await CustomerReview.findById(first._id)).status,'pending');
  assert.equal((await fetch(`${base}/${first._id}/decision`)).status,404);
  assert.equal((await CustomerReview.findById(first._id)).status,'pending');
  const decide=(id,status,customHeaders=headers) => fetch(`${base}/${id}/decision`,{method:'POST',headers:customHeaders,body:JSON.stringify({status})});
  assert.equal((await decide(first._id,'approved',{'Content-Type':'application/json'})).status,401);
  assert.equal((await decide(first._id,'approved',{...auth('user-test'),'Content-Type':'application/json'})).status,403);
  assert.equal((await decide(first._id,'approved')).status,200);
  assert.ok((await CustomerReview.findById(first._id)).decisionAt);
  assert.equal((await (await fetch(base)).json())[0].name,first.name);
  assert.deepEqual(Buffer.from(await (await fetch(`${base}/photos/${first.images[0]}`)).arrayBuffer()),data);
  assert.equal((await decide(first._id,'rejected')).status,409);
  const second=await submit('Verification rejection');assert.equal((await decide(second._id,'rejected')).status,200);
  assert.equal((await (await fetch(base)).json()).length,1);
  failEmail=true; const third=await submit('Verification SMTP failure');assert.equal(third.status,'pending');assert.equal(third.notification.status,'failed');
  failEmail=false; assert.equal((await fetch(`${base}/${third._id}/notify`,{method:'POST',headers})).status,200);
  assert.equal((await CustomerReview.findById(third._id)).notification.status,'sent');
  const draft=await CustomerReview.create({name:'',comment:'',rating:5,status:'draft'});
  assert.equal((await decide(draft._id,'approved')).status,400);
  const moderation=await (await fetch(`${base}/moderation`,{headers})).json();assert.ok(moderation.some(r=>r._id===String(draft._id)));
  const edit=await fetch(`${base}/${draft._id}/details`,{method:'PATCH',headers,body:JSON.stringify({name:'Isolated draft verification',comment:'Test-only draft completion, not a customer testimonial.',rating:5})});
  assert.equal(edit.status,200); assert.equal((await CustomerReview.findById(draft._id)).status,'draft');
  assert.equal((await decide(draft._id,'approved')).status,200);
  assert.ok((await (await fetch(base)).json()).some(r=>r._id===String(draft._id)));
  assert.equal(await CustomerReviewImage.countDocuments(),1);
 } finally {
  if(server)await new Promise(resolve=>server.close(resolve));
  // This database was created by this test only. Never touch the configured application database.
  if(mongoose.connection.name===testDb)await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  for(const [key,value] of Object.entries(saved)){if(value===undefined)delete process.env[key];else process.env[key]=value;}
 }
});

test('tour flags block listings and details while keeping vehicles available', async () => {
 const { SHOW_TOUR_PACKAGES, publicRouteEnabled } = await import('../../frontend/src/services/features.js');
 assert.equal(SHOW_TOUR_PACKAGES,false);
 for(const route of ['/tours','/tours/existing-package','/hotels','/smart-planner','/community']) assert.equal(publicRouteEnabled(route),false);
 assert.equal(publicRouteEnabled('/vehicles'),true);
});
