import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../../src/models/User.js";

// Ensure test environment flags and secrets are set immediately upon module load
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_jwt_secret_automated_suite_123456789";

let mongoServer;

export async function setupTestDB() {
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = "test_jwt_secret_automated_suite_123456789";

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // Guard: NEVER allow test DB URI to match regular development MONGO_URI
  if (process.env.MONGO_URI && process.env.MONGO_URI === uri) {
    throw new Error("Safety check failed: test DB URI matches production/development MONGO_URI");
  }

  await mongoose.connect(uri);
}

export async function clearTestDB() {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
}

export async function teardownTestDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
}

export async function createTestUser({ name = "Test User", email, password = "Password123!", role = "student" } = {}) {
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    passwordHash,
    role
  });

  const token = jwt.sign(
    { userId: user._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  return { user, token, password };
}
