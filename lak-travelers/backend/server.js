import 'dotenv/config';

import app from './app.js';
import connectDB from './config/db.js';

const requiredVariables = ['MONGO_URI', 'JWT_SECRET'];
const missingVariables = requiredVariables.filter((name) => !process.env[name]);
if (missingVariables.length) throw new Error(`Missing environment variables: ${missingVariables.join(', ')}`);

const port = Number(process.env.PORT) || 5001;
await connectDB();
const server = app.listen(port, '0.0.0.0', () => console.log(`Lak Travelers API listening on port ${port}`));

const shutdown = (signal) => {
  console.log(`${signal} received. Closing HTTP server.`);
  server.close(() => process.exit(0));
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
