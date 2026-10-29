import 'dotenv/config';
import mongoose from 'mongoose';
import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { pathToFileURL } from 'node:url';
import User from '../models/User.js';

export async function promoteOwnAccount(model, { email, password, confirmation }) {
 const normalized = String(email || '').trim().toLowerCase();
 if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new Error('Enter your exact login email.');
 if (confirmation !== `PROMOTE ${normalized}`) throw new Error('Confirmation did not match. No account changed.');
 const account = await model.findOne({ email: normalized });
 if (!account || !account.password || !await account.matchPassword(password)) throw new Error('Account/password could not be verified. Register or recover your own password through the website, then retry.');
 if (account.isBanned) throw new Error('This account is suspended. No account changed.');
 if (['admin','super-admin'].includes(account.role)) return 'Your verified account is already an administrator. Sign out and sign in again.';
 const result = await model.updateOne({ _id:account._id, email:normalized, role:account.role, isBanned:{$ne:true} }, { $set:{role:'admin'} });
 if (result.modifiedCount !== 1) throw new Error('Account changed during verification. No promotion completed; retry.');
 return 'Your verified account is now an administrator. Sign out, sign in again, then open /admin/reviews.';
}
async function main() {
 if (!process.stdin.isTTY) throw new Error('Run this owner-only command interactively in your terminal.');
 let muted = false;
 const output = new Writable({write(chunk, encoding, done) { if (!muted) process.stdout.write(chunk,encoding); done(); }});
 output.isTTY = true; output.columns = process.stdout.columns;
 const prompt = createInterface({input:process.stdin,output,terminal:true});
 try {
  console.log('Owner-only recovery. This uses your private database configuration and changes only the account you verify.');
  const email = (await prompt.question('Your exact login email: ')).trim().toLowerCase();
  const passwordPromise = prompt.question('Your existing password (hidden): '); muted = true;
  const password = await passwordPromise; muted = false; process.stdout.write('\n');
  const confirmation = await prompt.question(`To confirm ownership and promotion, type PROMOTE ${email}: `);
  if (confirmation !== `PROMOTE ${email}`) throw new Error('Cancelled. No account changed.');
  await mongoose.connect(process.env.MONGO_URI,{serverSelectionTimeoutMS:15000});
  console.log(await promoteOwnAccount(User,{email,password,confirmation}));
 } finally { muted=false; prompt.close(); await mongoose.disconnect(); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
 main().catch(error => { console.error(error.name === 'MongoServerSelectionError' ? 'Database connection failed. Check your private MONGO_URI and Atlas network access.' : error.message); process.exitCode=1; });
}
