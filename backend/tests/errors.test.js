import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { setupTestDB, teardownTestDB } from "./helpers/testDb.js";
import app from "../src/server.js";
import notFoundHandler from "../src/middleware/notFoundHandler.js";
import errorHandler from "../src/middleware/errorHandler.js";

// Helper to create mock Express response object for direct middleware unit testing
function createMockResponse() {
  return {
    statusCode: null,
    body: null,
    headersSent: false,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };
}

describe("Error Handling Middleware Tests", () => {
  before(async () => {
    await setupTestDB();
  });

  after(async () => {
    await teardownTestDB();
  });

  describe("Integration Tests via Express HTTP Pipeline", () => {
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

    it("should handle Mongoose validation errors with HTTP 400 through centralized error middleware", async () => {
      const res = await request(app).get("/api/test-errors/validation");
      assert.equal(res.status, 400);
      assert.equal(res.body.message, "Book validation failed: title is required");
    });

    it("should handle Mongoose CastError with HTTP 400 through centralized error middleware", async () => {
      const res = await request(app).get("/api/test-errors/cast");
      assert.equal(res.status, 400);
      assert.equal(res.body.message, "Invalid id");
    });

    it("should handle MongoDB duplicate key errors with HTTP 409 through centralized error middleware", async () => {
      const res = await request(app).get("/api/test-errors/duplicate");
      assert.equal(res.status, 409);
      assert.equal(res.body.message, "A record with this isbn already exists");
    });

    it("should handle unexpected server errors with safe HTTP 500 and hide internal details", async () => {
      const res = await request(app).get("/api/test-errors/unexpected");
      assert.equal(res.status, 500);
      assert.equal(res.body.message, "Internal server error");
      assert.equal(res.body.stack, undefined);
      assert.equal(res.body.error, undefined);
    });

    it("should ensure error responses do not leak stack traces or database connection details", async () => {
      const res = await request(app).get("/api/not-found-safety-check");
      assert.equal(res.status, 404);
      assert.equal(res.body.stack, undefined);
      assert.equal(res.body.error, undefined);
      assert.ok(!JSON.stringify(res.body).includes("mongodb://"));
    });
  });

  describe("Direct Unit Tests for notFoundHandler & errorHandler Middleware", () => {
    it("notFoundHandler: should respond with HTTP 404 and route not found message", () => {
      const req = { method: "GET", originalUrl: "/missing" };
      const res = createMockResponse();

      notFoundHandler(req, res);

      assert.equal(res.statusCode, 404);
      assert.deepEqual(res.body, { message: "Route not found" });
    });

    it("errorHandler: should handle SyntaxError from bad JSON with HTTP 400", () => {
      const err = new SyntaxError("Unexpected token");
      err.status = 400;
      err.body = "{bad json";
      const req = { method: "POST", originalUrl: "/api/test" };
      const res = createMockResponse();

      errorHandler(err, req, res, () => {});

      assert.equal(res.statusCode, 400);
      assert.equal(res.body.message, "Invalid JSON format in request body");
    });

    it("errorHandler: should handle CastError with HTTP 400", () => {
      const err = new Error("Cast to ObjectId failed");
      err.name = "CastError";
      err.path = "bookId";
      const req = { method: "GET", originalUrl: "/api/books/123" };
      const res = createMockResponse();

      errorHandler(err, req, res, () => {});

      assert.equal(res.statusCode, 400);
      assert.equal(res.body.message, "Invalid bookId");
    });

    it("errorHandler: should handle ValidationError with HTTP 400", () => {
      const err = new Error("Title is required");
      err.name = "ValidationError";
      const req = { method: "POST", originalUrl: "/api/books" };
      const res = createMockResponse();

      errorHandler(err, req, res, () => {});

      assert.equal(res.statusCode, 400);
      assert.equal(res.body.message, "Title is required");
    });

    it("errorHandler: should handle MongoDB duplicate key error (code 11000) with HTTP 409", () => {
      const err = new Error("E11000 duplicate key");
      err.code = 11000;
      err.keyPattern = { email: 1 };
      const req = { method: "POST", originalUrl: "/api/auth/register" };
      const res = createMockResponse();

      errorHandler(err, req, res, () => {});

      assert.equal(res.statusCode, 409);
      assert.equal(res.body.message, "A record with this email already exists");
    });

    it("errorHandler: should handle JsonWebTokenError with HTTP 401", () => {
      const err = new Error("jwt malformed");
      err.name = "JsonWebTokenError";
      const req = { method: "GET", originalUrl: "/api/auth/me" };
      const res = createMockResponse();

      errorHandler(err, req, res, () => {});

      assert.equal(res.statusCode, 401);
      assert.equal(res.body.message, "Invalid or expired token");
    });

    it("errorHandler: should handle TokenExpiredError with HTTP 401", () => {
      const err = new Error("jwt expired");
      err.name = "TokenExpiredError";
      const req = { method: "GET", originalUrl: "/api/auth/me" };
      const res = createMockResponse();

      errorHandler(err, req, res, () => {});

      assert.equal(res.statusCode, 401);
      assert.equal(res.body.message, "Invalid or expired token");
    });

    it("errorHandler: should handle unexpected server errors with HTTP 500 and safe message", () => {
      const err = new Error("Fatal database crash: secret connection failed");
      const req = { method: "GET", originalUrl: "/api/books" };
      const res = createMockResponse();

      errorHandler(err, req, res, () => {});

      assert.equal(res.statusCode, 500);
      assert.equal(res.body.message, "Internal server error");
      assert.equal(res.body.stack, undefined);
      assert.ok(!JSON.stringify(res.body).includes("secret"));
    });

    it("errorHandler: should delegate to next(err) if response headers were already sent", () => {
      const err = new Error("Error after headers");
      const req = { method: "GET", originalUrl: "/api/stream" };
      const res = createMockResponse();
      res.headersSent = true;
      let nextCalledWith = null;

      errorHandler(err, req, res, (e) => {
        nextCalledWith = e;
      });

      assert.equal(nextCalledWith, err);
      assert.equal(res.statusCode, null);
    });
  });
});
