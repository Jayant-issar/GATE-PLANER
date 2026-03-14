import mongoose from 'mongoose';

const TEST_URI =
  process.env.TEST_MONGODB_URI ??
  'mongodb://gate_user:gate_password@127.0.0.1:27017/gate_planner_test?authSource=admin';

export async function startTestDatabase() {
  process.env.MONGODB_URI = TEST_URI;
  const globalWithMongoose = global as { mongoose?: { conn: unknown; promise: unknown } };
  if (!globalWithMongoose.mongoose) {
    globalWithMongoose.mongoose = { conn: null, promise: null };
  } else {
    globalWithMongoose.mongoose.conn = null;
    globalWithMongoose.mongoose.promise = null;
  }
}

export async function clearTestDatabase() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_URI);
  }

  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  const globalWithMongoose = global as { mongoose?: { conn: unknown; promise: unknown } };
  if (!globalWithMongoose.mongoose) {
    globalWithMongoose.mongoose = { conn: null, promise: null };
  } else {
    globalWithMongoose.mongoose.conn = null;
    globalWithMongoose.mongoose.promise = null;
  }
}

export async function stopTestDatabase() {
  await clearTestDatabase();
}
