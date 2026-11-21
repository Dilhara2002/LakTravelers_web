// Explicitly local-only: never loads .env or connects to a production database.
import mongoose from 'mongoose';
import { PartnerApplication, PartnerDocument, PartnerProfile, PartnerSession, PartnerToken } from '../models/Partner.js';
const uri = process.env.MONGO_URI || '';
if (!/^mongodb:\/\/(?:127\.0\.0\.1|localhost):\d+\/lak-travelers-partner-(?:dev|test)$/.test(uri)) {
  throw new Error('Use an explicit localhost MONGO_URI ending in /lak-travelers-partner-dev or /lak-travelers-partner-test.');
}
try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  for (const model of [PartnerProfile, PartnerSession, PartnerToken, PartnerApplication, PartnerDocument]) {
    await model.createCollection();
    await model.createIndexes();
  }
  console.log('Local partner collections and indexes initialized. No existing records changed.');
} finally { await mongoose.disconnect(); }
