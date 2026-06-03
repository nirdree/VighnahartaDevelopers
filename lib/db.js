import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

/** @type {{ conn: mongoose.Connection | null, promise: Promise | null }} */
let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

/**
 * Connect to MongoDB using a cached connection.
 * @returns {Promise<mongoose.Connection>}
 */
async function dbConnect() {
  if (!MONGODB_URI) {
    throw new Error('Please define MONGODB_URI in .env.local');
  }
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
  }
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
  return cached.conn;
}

export default dbConnect;
