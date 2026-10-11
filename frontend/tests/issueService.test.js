import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  getAllIssues,
  getMyBorrowedBooks,
  issueBook,
  returnBook,
  getBooks
} from "../src/services/issueService.js";

// Mock localStorage for test environment
globalThis.localStorage = {
  store: {},
  getItem(key) {
    return this.store[key] || null;
  },
  setItem(key, value) {
    this.store[key] = String(value);
  },
  clear() {
    this.store = {};
  }
};

describe("Frontend issueService API Unit Tests (PR #17 / Issue #8)", () => {
  let lastFetchCall = null;

  beforeEach(() => {
    localStorage.clear();
    lastFetchCall = null;
    globalThis.fetch = async (url, options = {}) => {
      lastFetchCall = { url, options };
      return {
        ok: true,
        json: async () => ({ status: "ok", issues: [], books: [], count: 0 })
      };
    };
  });

  it("getAllIssues: should request /issues/all with no query parameter when status is omitted", async () => {
    await getAllIssues();
    assert.ok(lastFetchCall.url.endsWith("/issues/all"));
  });

  it("getAllIssues: should correctly append status query parameter", async () => {
    await getAllIssues("ISSUED");
    assert.ok(lastFetchCall.url.endsWith("/issues/all?status=ISSUED"));
  });

  it("getMyBorrowedBooks: should request /issues/my-borrowed endpoint", async () => {
    await getMyBorrowedBooks();
    assert.ok(lastFetchCall.url.endsWith("/issues/my-borrowed"));
  });

  it("issueBook: should send POST request with JSON payload", async () => {
    const payload = {
      bookId: "60d5ec49f1b2c3d4e5f6a7b1",
      studentId: "60d5ec49f1b2c3d4e5f6a7b2",
      dueDate: "2026-11-15"
    };
    await issueBook(payload);

    assert.ok(lastFetchCall.url.endsWith("/issues/issue"));
    assert.equal(lastFetchCall.options.method, "POST");
    assert.equal(lastFetchCall.options.headers["Content-Type"], "application/json");
    assert.equal(lastFetchCall.options.body, JSON.stringify(payload));
  });

  it("returnBook: should send POST request to /issues/return/:id", async () => {
    const issueId = "60d5ec49f1b2c3d4e5f6a7b3";
    await returnBook(issueId);

    assert.ok(lastFetchCall.url.endsWith(`/issues/return/${issueId}`));
    assert.equal(lastFetchCall.options.method, "POST");
  });

  it("getBooks: should send GET request to /books", async () => {
    await getBooks();
    assert.ok(lastFetchCall.url.endsWith("/books"));
  });

  it("request: should attach Authorization Bearer header when token exists", async () => {
    localStorage.setItem("token", "dummy-jwt-token-abc");
    await getAllIssues();

    assert.equal(
      lastFetchCall.options.headers.Authorization,
      "Bearer dummy-jwt-token-abc"
    );
  });

  it("request: should not attach Authorization header when token is absent", async () => {
    await getAllIssues();
    assert.equal(lastFetchCall.options.headers.Authorization, undefined);
  });

  it("request: should throw helpful error message when API responds with error status", async () => {
    globalThis.fetch = async () => ({
      ok: false,
      json: async () => ({ message: "Book has already been returned" })
    });

    await assert.rejects(
      async () => {
        await returnBook("some-id");
      },
      {
        name: "Error",
        message: "Book has already been returned"
      }
    );
  });
});
