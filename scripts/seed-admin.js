/**
 * Seed script to create the first Admin user.
 * Run once: node scripts/seed-admin.js
 * Requires MONGODB_URI in environment.
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set in .env.local');

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const existing = await mongoose.connection.collection('users').findOne({ email: 'admin@rentalhub.com' });
  if (existing) {
    console.log('Admin already exists!');
    process.exit(0);
  }

  const hash = await bcrypt.hash('admin123', 12);
  await mongoose.connection.collection('users').insertOne({
    name: 'Admin',
    email: 'admin@rentalhub.com',
    password: hash,
    role: 'Admin',
    contactNumber: '+1-555-0100',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log('✅ Admin created!');
  console.log('Email: admin@rentalhub.com');
  console.log('Password: admin123');
  console.log('⚠️  Change the password after first login!');
  
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
