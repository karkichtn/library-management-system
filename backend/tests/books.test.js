import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import request from "supertest";
import { setupTestDB, clearTestDB, teardownTestDB, createTestUser } from "./helpers/testDb.js";
import app from "../src/server.js";
import Book from "../src/models/Book.js";

describe("Book Read & Write API Tests", () => {
  let adminToken;
  let studentToken;

  before(async () => {
    await setupTestDB();
  });

  after(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
    const admin = await createTestUser({ email: "admin_books@college.edu", role: "admin" });
    adminToken = admin.token;
    const student = await createTestUser({ email: "student_books@college.edu", role: "student" });
    studentToken = student.token;
  });

  describe("GET /api/books", () => {
    it("should return empty list when no books exist (200)", async () => {
      const res = await request(app).get("/api/books");
      assert.equal(res.status, 200);
      assert.equal(res.body.count, 0);
      assert.deepEqual(res.body.books, []);
    });

    it("should return list of books sorted by newest first", async () => {
      const now = Date.now();
      await Book.create({
        title: "Book 1",
        author: "Author 1",
        isbn: "111-111-1111",
        category: "Fiction",
        publicationYear: 2020,
        totalCopies: 5,
        availableCopies: 5,
        createdAt: new Date(now - 10000)
      });
      await Book.create({
        title: "Book 2",
        author: "Author 2",
        isbn: "222-222-2222",
        category: "Tech",
        publicationYear: 2021,
        totalCopies: 3,
        availableCopies: 3,
        createdAt: new Date(now)
      });

      const res = await request(app).get("/api/books");
      assert.equal(res.status, 200);
      assert.equal(res.body.count, 2);
      assert.equal(res.body.books[0].title, "Book 2");
    });

    it("should support search, category, and availability filters", async () => {
      await Book.create({
        title: "Clean Code",
        author: "Robert C. Martin",
        isbn: "978-0132350884",
        category: "Programming",
        publicationYear: 2008,
        totalCopies: 5,
        availableCopies: 2
      });
      await Book.create({
        title: "Unavailable Book",
        author: "Other Author",
        isbn: "978-0000000000",
        category: "Programming",
        publicationYear: 2010,
        totalCopies: 2,
        availableCopies: 0
      });

      // Filter category
      const resCat = await request(app).get("/api/books?category=programming");
      assert.equal(resCat.status, 200);
      assert.equal(resCat.body.count, 2);

      // Filter available=true
      const resAvail = await request(app).get("/api/books?available=true");
      assert.equal(resAvail.status, 200);
      assert.equal(resAvail.body.count, 1);
      assert.equal(resAvail.body.books[0].title, "Clean Code");

      // Filter available=false
      const resUnavail = await request(app).get("/api/books?available=false");
      assert.equal(resUnavail.status, 200);
      assert.equal(resUnavail.body.count, 1);
      assert.equal(resUnavail.body.books[0].title, "Unavailable Book");
    });

    it("should safely handle regular expression special characters in search", async () => {
      await Book.create({
        title: "Special [Edition] Book (Volume 1)",
        author: "C++ Author",
        isbn: "978-1234567890",
        category: "Tech / (Core)",
        publicationYear: 2022,
        totalCopies: 3,
        availableCopies: 3
      });

      // Search with bracket
      const resBracket = await request(app).get("/api/books?search=[");
      assert.equal(resBracket.status, 200);
      assert.equal(resBracket.body.count, 1);

      // Search with parenthesis
      const resParen = await request(app).get("/api/books?search=(");
      assert.equal(resParen.status, 200);
      assert.equal(resParen.body.count, 1);

      // Search literal C++
      const resPlus = await request(app).get(`/api/books?author=${encodeURIComponent("C++")}`);
      assert.equal(resPlus.status, 200);
      assert.equal(resPlus.body.count, 1);
    });
  });

  describe("GET /api/books/:id", () => {
    it("should retrieve a book by valid ObjectId (200)", async () => {
      const book = await Book.create({
        title: "Specific Book",
        author: "Author",
        isbn: "333-333-3333",
        category: "General",
        publicationYear: 2019,
        totalCopies: 4,
        availableCopies: 4
      });

      const res = await request(app).get(`/api/books/${book._id}`);
      assert.equal(res.status, 200);
      assert.equal(res.body.book.title, "Specific Book");
    });

    it("should return HTTP 404 for nonexistent valid ObjectId", async () => {
      const nonExistent = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/books/${nonExistent}`);
      assert.equal(res.status, 404);
      assert.equal(res.body.message, "Book not found");
    });

    it("should return HTTP 400 for malformed book ID", async () => {
      const res = await request(app).get("/api/books/invalid-id-format");
      assert.equal(res.status, 400);
      assert.equal(res.body.message, "Invalid book ID");
    });
  });

  describe("POST /api/books", () => {
    const validPayload = {
      title: "Design Patterns",
      author: "Erich Gamma, Richard Helm",
      isbn: "978-0201633610",
      category: "Software Engineering",
      publicationYear: 1994,
      totalCopies: 6,
      availableCopies: 6
    };

    it("should require authentication (401)", async () => {
      const res = await request(app)
        .post("/api/books")
        .send(validPayload);

      assert.equal(res.status, 401);
      assert.equal(res.body.message, "Authentication required");
    });

    it("should restrict creation to admin role (student returns 403)", async () => {
      const res = await request(app)
        .post("/api/books")
        .set("Authorization", `Bearer ${studentToken}`)
        .send(validPayload);

      assert.equal(res.status, 403);
      assert.equal(res.body.message, "Admin access required");
    });

    it("should create book successfully as admin (201)", async () => {
      const res = await request(app)
        .post("/api/books")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(validPayload);

      assert.equal(res.status, 201);
      assert.equal(res.body.message, "Book created successfully");
      assert.equal(res.body.book.title, "Design Patterns");
    });

    it("should reject creation with missing required fields (400)", async () => {
      const res = await request(app)
        .post("/api/books")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ title: "Incomplete Book" });

      assert.equal(res.status, 400);
      assert.equal(res.body.message, "All required fields must be provided");
    });

    it("should reject creation with duplicate ISBN (409)", async () => {
      await Book.create(validPayload);

      const res = await request(app)
        .post("/api/books")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ ...validPayload, title: "Duplicate Book" });

      assert.equal(res.status, 409);
      assert.equal(res.body.message, "A book with this ISBN already exists");
    });

    it("should reject creation when availableCopies > totalCopies (400)", async () => {
      const res = await request(app)
        .post("/api/books")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          ...validPayload,
          isbn: "978-1111111111",
          totalCopies: 2,
          availableCopies: 5
        });

      assert.equal(res.status, 400);
      assert.equal(res.body.message, "Available copies cannot exceed total copies");
    });

    it("should reject creation with future publicationYear (400)", async () => {
      const res = await request(app)
        .post("/api/books")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          ...validPayload,
          isbn: "978-2222222222",
          publicationYear: 99999
        });

      assert.equal(res.status, 400);
      assert.ok(res.body.message.includes("Publication year cannot exceed the current year"));
    });
  });

  describe("PUT /api/books/:id", () => {
    it("should restrict updates to admin role (student returns 403)", async () => {
      const book = await Book.create({
        title: "Refactoring",
        author: "Martin Fowler",
        isbn: "978-0201485677",
        category: "Software",
        publicationYear: 1999,
        totalCopies: 4,
        availableCopies: 4
      });

      const res = await request(app)
        .put(`/api/books/${book._id}`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send({ title: "Updated Refactoring" });

      assert.equal(res.status, 403);
    });

    it("should update a book successfully as admin (200)", async () => {
      const book = await Book.create({
        title: "Original Title",
        author: "Author",
        isbn: "978-4444444444",
        category: "Tech",
        publicationYear: 2020,
        totalCopies: 4,
        availableCopies: 4
      });

      const res = await request(app)
        .put(`/api/books/${book._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ title: "New Title", availableCopies: 3 });

      assert.equal(res.status, 200);
      assert.equal(res.body.message, "Book updated successfully");
      assert.equal(res.body.book.title, "New Title");
      assert.equal(res.body.book.availableCopies, 3);
    });

    it("should return HTTP 404 when updating nonexistent book", async () => {
      const nonExistent = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/books/${nonExistent}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ title: "Nonexistent" });

      assert.equal(res.status, 404);
      assert.equal(res.body.message, "Book not found");
    });

    it("should return HTTP 400 when updating with availableCopies > totalCopies", async () => {
      const book = await Book.create({
        title: "Copies Test",
        author: "Author",
        isbn: "978-5555555555",
        category: "Tech",
        publicationYear: 2020,
        totalCopies: 3,
        availableCopies: 3
      });

      const res = await request(app)
        .put(`/api/books/${book._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ availableCopies: 10 });

      assert.equal(res.status, 400);
      assert.equal(res.body.message, "Available copies cannot exceed total copies");
    });
  });

  describe("DELETE /api/books/:id", () => {
    it("should restrict deletion to admin role (student returns 403)", async () => {
      const book = await Book.create({
        title: "To Be Deleted",
        author: "Author",
        isbn: "978-6666666666",
        category: "Tech",
        publicationYear: 2020,
        totalCopies: 1,
        availableCopies: 1
      });

      const res = await request(app)
        .delete(`/api/books/${book._id}`)
        .set("Authorization", `Bearer ${studentToken}`);

      assert.equal(res.status, 403);
    });

    it("should delete book successfully as admin (200)", async () => {
      const book = await Book.create({
        title: "Delete Me",
        author: "Author",
        isbn: "978-7777777777",
        category: "Tech",
        publicationYear: 2020,
        totalCopies: 1,
        availableCopies: 1
      });

      const res = await request(app)
        .delete(`/api/books/${book._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.message, "Book deleted successfully");

      const check = await Book.findById(book._id);
      assert.equal(check, null);
    });

    it("should return HTTP 404 when deleting nonexistent book", async () => {
      const nonExistent = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/books/${nonExistent}`)
        .set("Authorization", `Bearer ${adminToken}`);

      assert.equal(res.status, 404);
      assert.equal(res.body.message, "Book not found");
    });
  });
});
