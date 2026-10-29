import test from 'node:test';
import assert from 'node:assert/strict';
import { promoteOwnAccount } from '../scripts/promoteAdmin.js';
test('admin CLI requires exact deliberate confirmation and matching account password', async () => {
 let updates=0;
 const account={_id:'own-account',email:'owner@example.test',password:'hash-never-printed',role:'user',isBanned:false,matchPassword:async value=>value==='verified-password'};
 const model={findOne:async({email})=>email===account.email?account:null,updateOne:async(query,update)=>{assert.equal(query._id,account._id);assert.deepEqual(update,{$set:{role:'admin'}});updates++;return {modifiedCount:1};}};
 const valid={email:account.email,password:'verified-password',confirmation:`PROMOTE ${account.email}`};
 await assert.rejects(promoteOwnAccount(model,{...valid,confirmation:'yes'}));
 await assert.rejects(promoteOwnAccount(model,{...valid,password:'wrong'}));
 await assert.rejects(promoteOwnAccount(model,{...valid,email:'other@example.test',confirmation:'PROMOTE other@example.test'}));
 assert.equal(updates,0);
 await promoteOwnAccount(model,valid);assert.equal(updates,1);
 account.role='admin';assert.match(await promoteOwnAccount(model,valid),/already/);assert.equal(updates,1);
 account.isBanned=true;await assert.rejects(promoteOwnAccount(model,valid));assert.equal(updates,1);
});
