import mongoose from 'mongoose';

const TEST_URI =
  process.env.TEST_MONGODB_URI ??
  'mongodb://gate_user:gate_password@127.0.0.1:27017/gate_planner_test?authSource=admin';

export async function startTestDatabase() {
  process.env.MONGODB_URI = TEST_URI;
  (global as { mongoose?: { conn: unknown; promise: unknown } }).mongoose = {
    conn: null,
    promise: null,
  };
}

export async function clearTestDatabase() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_URI);
  }

  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  (global as { mongoose?: { conn: unknown; promise: unknown } }).mongoose = {
    conn: null,
    promise: null,
  };
}

export async function stopTestDatabase() {
  await clearTestDatabase();
}
