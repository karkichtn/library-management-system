import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { getBooks, createBook, updateBook, getBookById } from "../src/services/bookService.js";

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

describe("Frontend bookService API Unit Tests", () => {
  let lastFetchCall = null;

  beforeEach(() => {
    localStorage.clear();
    lastFetchCall = null;
    globalThis.fetch = async (url, options = {}) => {
      lastFetchCall = { url, options };
      return {
        ok: true,
        json: async () => ({ status: "ok", books: [], count: 0 })
      };
    };
  });

  it("getBooks: should safely handle empty filters object without throwing", async () => {
    await getBooks({});
    assert.ok(lastFetchCall.url.endsWith("/books"));
  });

  it("getBooks: should safely handle no arguments (default filters) without throwing", async () => {
    await getBooks();
    assert.ok(lastFetchCall.url.endsWith("/books"));
  });

  it("getBooks: should correctly trim and parameterize search query", async () => {
    await getBooks({ search: "  Clean Architecture  " });
    assert.ok(lastFetchCall.url.includes("search=Clean+Architecture"));
  });

  it("getBooks: should correctly parameterize category filter", async () => {
    await getBooks({ category: "Programming" });
    assert.ok(lastFetchCall.url.includes("category=Programming"));
  });

  it("getBooks: should combine search and category filters correctly", async () => {
    await getBooks({ search: "Refactoring", category: "Software" });
    assert.ok(lastFetchCall.url.includes("search=Refactoring"));
    assert.ok(lastFetchCall.url.includes("category=Software"));
  });

  it("getBooks: should attach Authorization Bearer header when token exists", async () => {
    localStorage.setItem("token", "mock_jwt_token_123");
    await getBooks({ search: "test" });
    assert.equal(lastFetchCall.options.headers.Authorization, "Bearer mock_jwt_token_123");
  });

  it("createBook: should send POST request with JSON payload", async () => {
    const payload = { title: "New Book", author: "Author", isbn: "12345" };
    await createBook(payload);
    assert.equal(lastFetchCall.options.method, "POST");
    assert.equal(lastFetchCall.options.headers["Content-Type"], "application/json");
    assert.equal(lastFetchCall.options.body, JSON.stringify(payload));
  });

  it("updateBook: should send PUT request to specific book ID", async () => {
    const payload = { title: "Updated Book" };
    await updateBook("book_id_999", payload);
    assert.ok(lastFetchCall.url.endsWith("/books/book_id_999"));
    assert.equal(lastFetchCall.options.method, "PUT");
    assert.equal(lastFetchCall.options.body, JSON.stringify(payload));
  });

  it("getBookById: should send GET request to specific book ID", async () => {
    await getBookById("book_id_123");
    assert.ok(lastFetchCall.url.endsWith("/books/book_id_123"));
  });

  it("request: should throw helpful error message when API responds with error status", async () => {
    globalThis.fetch = async () => ({
      ok: false,
      json: async () => ({ message: "Book with this ISBN already exists" })
    });

    await assert.rejects(
      async () => {
        await createBook({ title: "Dup Book" });
      },
      {
        name: "Error",
        message: "Book with this ISBN already exists"
      }
    );
  });
});
