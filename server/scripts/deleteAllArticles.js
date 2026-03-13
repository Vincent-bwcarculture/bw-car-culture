// server/scripts/deleteAllArticles.js
// Run with: node server/scripts/deleteAllArticles.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_NAME
  });
  console.log('Connected to MongoDB');

  const result = await mongoose.connection.db.collection('news').deleteMany({});
  console.log(`Deleted ${result.deletedCount} articles from the news collection.`);

  await mongoose.disconnect();
  console.log('Done.');
  process.exit(0);
};

run().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
