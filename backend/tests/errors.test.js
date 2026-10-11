import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { setupTestDB, teardownTestDB } from "./helpers/testDb.js";
import app from "../src/server.js";

describe("Error Handling Middleware Tests", () => {
  before(async () => {
    await setupTestDB();
  });

  after(async () => {
    await teardownTestDB();
  });

  it("should return HTTP 404 with predictable JSON for nonexistent routes", async () => {
    const res = await request(app).get("/api/nonexistent-route-endpoint");
    assert.equal(res.status, 404);
    assert.deepEqual(res.body, { message: "Route not found" });
  });

  it("should return HTTP 404 for unknown deep nested route", async () => {
    const res = await request(app).post("/api/books/unknown/action/here");
    assert.equal(res.status, 404);
    assert.equal(res.body.message, "Route not found");
  });

  it("should return HTTP 400 when sending malformed JSON in request body", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send('{"email": "test@example.com", "password": invalid_json_here}');

    assert.equal(res.status, 400);
    assert.equal(res.body.message, "Invalid JSON format in request body");
  });

  it("should ensure error responses do not leak stack traces or database connection details", async () => {
    const res = await request(app).get("/api/not-found-safety-check");
    assert.equal(res.status, 404);
    assert.equal(res.body.stack, undefined);
    assert.equal(res.body.error, undefined);
    assert.ok(!JSON.stringify(res.body).includes("mongodb://"));
  });
});
