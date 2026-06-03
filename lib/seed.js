/**
 * Seed script — run with: node lib/seed.js
 * Creates an initial admin user if none exists.
 * Set MONGODB_URI in .env.local before running.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vighnaharta';

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, lowercase: true },
  password: String,
  role: { type: String, enum: ['admin', 'agent'], default: 'agent' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const User = mongoose.model('User', UserSchema);

  const existing = await User.findOne({ role: 'admin' });
  if (existing) {
    console.log('Admin already exists:', existing.email);
    process.exit(0);
  }

  const hashed = await bcrypt.hash('admin@123', 12);
  const admin = await User.create({
    name: 'Super Admin',
    email: 'admin@vighnaharta.dev',
    password: hashed,
    role: 'admin',
    isActive: true,
  });

  console.log('✅ Admin created successfully!');
  console.log('   Email:    admin@vighnaharta.dev');
  console.log('   Password: admin@123');
  console.log('   ⚠️  Change password after first login!');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
