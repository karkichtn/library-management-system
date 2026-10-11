import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { setupTestDB, clearTestDB, teardownTestDB, createTestUser } from "./helpers/testDb.js";
import app from "../src/server.js";

describe("Authentication & Authorization API Tests", () => {
  before(async () => {
    await setupTestDB();
  });

  after(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  describe("POST /api/auth/register", () => {
    it("should successfully register a student user with valid data", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Alice Johnson",
          email: "alice@college.edu",
          password: "SecurePassword123!"
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.message, "Registration successful");
      assert.ok(typeof res.body.token === "string" && res.body.token.length > 20);
      assert.equal(res.body.user.name, "Alice Johnson");
      assert.equal(res.body.user.email, "alice@college.edu");
      assert.equal(res.body.user.role, "student");
      assert.equal(res.body.user.password, undefined);
      assert.equal(res.body.user.passwordHash, undefined);
    });

    it("should reject registration when required fields are missing", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ name: "Bob", email: "bob@college.edu" });

      assert.equal(res.status, 400);
      assert.equal(res.body.message, "Name, email and password are required");
    });

    it("should reject registration with name shorter than 2 characters", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ name: "A", email: "a@college.edu", password: "Password123!" });

      assert.equal(res.status, 400);
      assert.equal(res.body.message, "Name must contain at least 2 characters");
    });

    it("should reject registration with invalid email format", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ name: "Charlie", email: "not-an-email", password: "Password123!" });

      assert.equal(res.status, 400);
      assert.equal(res.body.message, "Enter a valid email address");
    });

    it("should reject registration with password shorter than 8 characters", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ name: "David", email: "david@college.edu", password: "short" });

      assert.equal(res.status, 400);
      assert.equal(res.body.message, "Password must contain at least 8 characters");
    });

    it("should reject registration with duplicate email (409)", async () => {
      await createTestUser({ email: "existing@college.edu" });

      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Duplicate User",
          email: "existing@college.edu",
          password: "Password123!"
        });

      assert.equal(res.status, 409);
      assert.equal(res.body.message, "Email is already registered");
    });
  });

  describe("POST /api/auth/login", () => {
    it("should successfully authenticate with valid credentials", async () => {
      await createTestUser({ email: "login_test@college.edu", password: "MyPassword123!" });

      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "login_test@college.edu",
          password: "MyPassword123!"
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.message, "Login successful");
      assert.ok(typeof res.body.token === "string");
      assert.equal(res.body.user.email, "login_test@college.edu");
      assert.equal(res.body.user.password, undefined);
      assert.equal(res.body.user.passwordHash, undefined);
    });

    it("should reject login with unregistered email (401)", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "unknown@college.edu",
          password: "Password123!"
        });

      assert.equal(res.status, 401);
      assert.equal(res.body.message, "Invalid email or password");
    });

    it("should reject login with incorrect password (401)", async () => {
      await createTestUser({ email: "user@college.edu", password: "CorrectPassword123!" });

      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "user@college.edu",
          password: "WrongPassword!"
        });

      assert.equal(res.status, 401);
      assert.equal(res.body.message, "Invalid email or password");
    });

    it("should reject login when fields are missing (400)", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "user@college.edu" });

      assert.equal(res.status, 400);
      assert.equal(res.body.message, "Email and password are required");
    });
  });

  describe("GET /api/auth/me", () => {
    it("should return the current user profile when authenticated", async () => {
      const { user, token } = await createTestUser({ email: "me_test@college.edu", name: "Me User" });

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.user.email, "me_test@college.edu");
      assert.equal(res.body.user.id, user._id.toString());
    });

    it("should reject request without Authorization header (401)", async () => {
      const res = await request(app).get("/api/auth/me");
      assert.equal(res.status, 401);
      assert.equal(res.body.message, "Authentication required");
    });

    it("should reject request with invalid token (401)", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid.token.payload");

      assert.equal(res.status, 401);
      assert.equal(res.body.message, "Invalid or expired token");
    });
  });

  describe("GET /api/auth/admin-check", () => {
    it("should allow access for administrator role (200)", async () => {
      const { token } = await createTestUser({ email: "admin@college.edu", role: "admin" });

      const res = await request(app)
        .get("/api/auth/admin-check")
        .set("Authorization", `Bearer ${token}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.message, "Admin access granted");
    });

    it("should reject student role with HTTP 403 Forbidden", async () => {
      const { token } = await createTestUser({ email: "student@college.edu", role: "student" });

      const res = await request(app)
        .get("/api/auth/admin-check")
        .set("Authorization", `Bearer ${token}`);

      assert.equal(res.status, 403);
      assert.equal(res.body.message, "Admin access required");
    });
  });
});
