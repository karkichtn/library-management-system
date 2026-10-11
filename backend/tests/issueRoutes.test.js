process.env.NODE_ENV = "test";
const JWT_SECRET = "test-secret-key-1234567890-test-secret";
process.env.JWT_SECRET = JWT_SECRET;

import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import jwt from "jsonwebtoken";
import app from "../src/server.js";
import User from "../src/models/User.js";
import Book from "../src/models/Book.js";
import Issue from "../src/models/Issue.js";


let mongoServer;
let adminUser;
let adminToken;
let studentUser;
let studentToken;
let secondStudent;
let secondStudentToken;

function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "1h" });
}

describe("Issue & Return Backend API (PR #16 / Issue #4)", () => {
  before(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    // Create Admin User
    adminUser = await User.create({
      name: "Admin Tester",
      email: "admin@test.com",
      passwordHash: "hash123",
      role: "admin"
    });
    adminToken = generateToken(adminUser._id);

    // Create Student User
    studentUser = await User.create({
      name: "Student One",
      email: "student1@test.com",
      passwordHash: "hash123",
      role: "student"
    });
    studentToken = generateToken(studentUser._id);

    // Create Second Student User
    secondStudent = await User.create({
      name: "Student Two",
      email: "student2@test.com",
      passwordHash: "hash123",
      role: "student"
    });
    secondStudentToken = generateToken(secondStudent._id);
  });

  after(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    await Book.deleteMany({});
    await Issue.deleteMany({});
  });

  describe("POST /api/issues/issue - Issue Book", () => {
    it("1. Successfully issues an available book to a student", async () => {
      const book = await Book.create({
        title: "Clean Code",
        author: "Robert C. Martin",
        isbn: "9780132350884",
        category: "Software",
        publicationYear: 2008,
        totalCopies: 5,
        availableCopies: 5
      });

      const res = await request(app)
        .post("/api/issues/issue")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          bookId: book._id.toString(),
          studentId: studentUser._id.toString(),
          dueDate: "2026-11-01"
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.message, "Book issued successfully");
      assert.equal(res.body.issue.status, "ISSUED");
      assert.equal(res.body.issue.book._id, book._id.toString());
      assert.equal(res.body.issue.student._id, studentUser._id.toString());

      // Verify book count decreased in database
      const updatedBook = await Book.findById(book._id);
      assert.equal(updatedBook.availableCopies, 4);

      // Verify issue record exists in database
      const savedIssue = await Issue.findById(res.body.issue._id);
      assert.ok(savedIssue);
      assert.equal(savedIssue.status, "ISSUED");
    });

    it("2. Fails when book does not exist", async () => {
      const nonExistentBookId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .post("/api/issues/issue")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          bookId: nonExistentBookId,
          studentId: studentUser._id.toString()
        });

      assert.equal(res.status, 404);
      assert.equal(res.body.message, "Book not found");
    });

    it("3. Fails when student does not exist", async () => {
      const book = await Book.create({
        title: "The Pragmatic Programmer",
        author: "David Thomas",
        isbn: "9780135957059",
        category: "Software",
        publicationYear: 2019,
        totalCopies: 3,
        availableCopies: 3
      });

      const nonExistentStudentId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .post("/api/issues/issue")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          bookId: book._id.toString(),
          studentId: nonExistentStudentId
        });

      assert.equal(res.status, 404);
      assert.equal(res.body.message, "Student not found");

      // Verify copies remained unchanged
      const checkBook = await Book.findById(book._id);
      assert.equal(checkBook.availableCopies, 3);
    });

    it("4. Fails with missing required fields or malformed IDs", async () => {
      // Missing fields
      const resMissing = await request(app)
        .post("/api/issues/issue")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({});
      assert.equal(resMissing.status, 400);
      assert.equal(resMissing.body.message, "Book and student are required");

      // Malformed ID
      const resMalformed = await request(app)
        .post("/api/issues/issue")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          bookId: "invalid-id",
          studentId: studentUser._id.toString()
        });
      assert.equal(resMalformed.status, 400);
      assert.equal(resMalformed.body.message, "Invalid book or student ID");
    });

    it("5. Fails when no copies are available (availableCopies = 0)", async () => {
      const book = await Book.create({
        title: "Zero Copies Book",
        author: "Author",
        isbn: "9780000000001",
        category: "General",
        publicationYear: 2020,
        totalCopies: 2,
        availableCopies: 0
      });

      const res = await request(app)
        .post("/api/issues/issue")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          bookId: book._id.toString(),
          studentId: studentUser._id.toString()
        });

      assert.equal(res.status, 400);
      assert.equal(res.body.message, "No copies available for this book");

      // Verify book count remains 0
      const checkBook = await Book.findById(book._id);
      assert.equal(checkBook.availableCopies, 0);
    });

    it("6. Fails when student already has an active issue for the same book", async () => {
      const book = await Book.create({
        title: "Active Issue Test",
        author: "Author",
        isbn: "9780000000002",
        category: "General",
        publicationYear: 2021,
        totalCopies: 5,
        availableCopies: 5
      });

      // First issue succeeds
      const firstRes = await request(app)
        .post("/api/issues/issue")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          bookId: book._id.toString(),
          studentId: studentUser._id.toString()
        });
      assert.equal(firstRes.status, 201);

      // Second issue for same student & book fails
      const secondRes = await request(app)
        .post("/api/issues/issue")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          bookId: book._id.toString(),
          studentId: studentUser._id.toString()
        });
      assert.equal(secondRes.status, 400);
      assert.equal(
        secondRes.body.message,
        "Student already has an active issue for this book"
      );

      // Available copies only decreased once (5 -> 4)
      const checkBook = await Book.findById(book._id);
      assert.equal(checkBook.availableCopies, 4);
    });

    it("7. Fails when dueDate format is invalid", async () => {
      const book = await Book.create({
        title: "Date Test Book",
        author: "Author",
        isbn: "9780000000003",
        category: "General",
        publicationYear: 2020,
        totalCopies: 2,
        availableCopies: 2
      });

      const res = await request(app)
        .post("/api/issues/issue")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          bookId: book._id.toString(),
          studentId: studentUser._id.toString(),
          dueDate: "invalid-date-string"
        });

      assert.equal(res.status, 400);
      assert.equal(res.body.message, "Invalid due date");
    });

    it("8. Rejects unauthenticated and unauthorized requests (role enforcement)", async () => {
      const book = await Book.create({
        title: "Security Test Book",
        author: "Author",
        isbn: "9780000000004",
        category: "Security",
        publicationYear: 2022,
        totalCopies: 2,
        availableCopies: 2
      });

      // Unauthenticated
      const unauthRes = await request(app)
        .post("/api/issues/issue")
        .send({
          bookId: book._id.toString(),
          studentId: studentUser._id.toString()
        });
      assert.equal(unauthRes.status, 401);

      // Student token (unauthorized for librarian issue action)
      const studentRes = await request(app)
        .post("/api/issues/issue")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          bookId: book._id.toString(),
          studentId: studentUser._id.toString()
        });
      assert.equal(studentRes.status, 403);
      assert.equal(studentRes.body.message, "Admin access required");
    });
  });

  describe("POST /api/issues/return/:id - Return Book", () => {
    it("9. Successfully returns an issued book and increments availableCopies", async () => {
      const book = await Book.create({
        title: "Return Success Book",
        author: "Author",
        isbn: "9780000000005",
        category: "Fiction",
        publicationYear: 2020,
        totalCopies: 3,
        availableCopies: 2
      });

      const issue = await Issue.create({
        book: book._id,
        student: studentUser._id,
        dueDate: new Date(Date.now() + 7 * 86400000),
        status: "ISSUED"
      });

      const res = await request(app)
        .post(`/api/issues/return/${issue._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.message, "Book returned successfully");
      assert.equal(res.body.issue.status, "RETURNED");
      assert.ok(res.body.issue.returnDate);

      // Verify book count increased
      const updatedBook = await Book.findById(book._id);
      assert.equal(updatedBook.availableCopies, 3);
    });

    it("10. Fails when issue does not exist", async () => {
      const nonExistentIssueId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .post(`/api/issues/return/${nonExistentIssueId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      assert.equal(res.status, 404);
      assert.equal(res.body.message, "Issue record not found");
    });

    it("11. Fails when issue ID is malformed", async () => {
      const res = await request(app)
        .post("/api/issues/return/invalid-id")
        .set("Authorization", `Bearer ${adminToken}`);

      assert.equal(res.status, 400);
      assert.equal(res.body.message, "Invalid issue ID");
    });

    it("12. Prevents double-returning the same issue", async () => {
      const book = await Book.create({
        title: "Double Return Test",
        author: "Author",
        isbn: "9780000000006",
        category: "Test",
        publicationYear: 2021,
        totalCopies: 4,
        availableCopies: 3
      });

      const issue = await Issue.create({
        book: book._id,
        student: studentUser._id,
        dueDate: new Date(Date.now() + 7 * 86400000),
        status: "ISSUED"
      });

      // First return succeeds
      const firstRes = await request(app)
        .post(`/api/issues/return/${issue._id}`)
        .set("Authorization", `Bearer ${adminToken}`);
      assert.equal(firstRes.status, 200);

      // Second return fails
      const secondRes = await request(app)
        .post(`/api/issues/return/${issue._id}`)
        .set("Authorization", `Bearer ${adminToken}`);
      assert.equal(secondRes.status, 400);
      assert.equal(secondRes.body.message, "Book has already been returned");

      // Verify available copies was incremented only once (3 -> 4)
      const updatedBook = await Book.findById(book._id);
      assert.equal(updatedBook.availableCopies, 4);
    });

    it("13. Prevents availableCopies from exceeding totalCopies", async () => {
      const book = await Book.create({
        title: "Max Copies Test",
        author: "Author",
        isbn: "9780000000007",
        category: "Test",
        publicationYear: 2021,
        totalCopies: 2,
        availableCopies: 2 // already at max
      });

      const issue = await Issue.create({
        book: book._id,
        student: studentUser._id,
        dueDate: new Date(Date.now() + 7 * 86400000),
        status: "ISSUED"
      });

      const res = await request(app)
        .post(`/api/issues/return/${issue._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      assert.equal(res.status, 200);

      const updatedBook = await Book.findById(book._id);
      assert.equal(updatedBook.availableCopies, 2);
      assert.ok(updatedBook.availableCopies <= updatedBook.totalCopies);
    });

    it("14. Rejects student requests to return books", async () => {
      const book = await Book.create({
        title: "Student Return Reject",
        author: "Author",
        isbn: "9780000000008",
        category: "Test",
        publicationYear: 2021,
        totalCopies: 2,
        availableCopies: 1
      });

      const issue = await Issue.create({
        book: book._id,
        student: studentUser._id,
        dueDate: new Date(Date.now() + 7 * 86400000),
        status: "ISSUED"
      });

      const res = await request(app)
        .post(`/api/issues/return/${issue._id}`)
        .set("Authorization", `Bearer ${studentToken}`);

      assert.equal(res.status, 403);
      assert.equal(res.body.message, "Admin access required");
    });
  });

  describe("GET /api/issues/my-borrowed - Student Borrowed Records", () => {
    it("15. Returns only the logged-in student's borrowed records", async () => {
      const bookA = await Book.create({
        title: "Student Book A",
        author: "Author A",
        isbn: "9780000000009",
        category: "Category A",
        publicationYear: 2020,
        totalCopies: 2,
        availableCopies: 1
      });

      const bookB = await Book.create({
        title: "Student Book B",
        author: "Author B",
        isbn: "9780000000010",
        category: "Category B",
        publicationYear: 2020,
        totalCopies: 2,
        availableCopies: 1
      });

      // Issue 1 to studentUser
      await Issue.create({
        book: bookA._id,
        student: studentUser._id,
        dueDate: new Date(Date.now() + 7 * 86400000),
        status: "ISSUED"
      });

      // Issue 2 to secondStudent
      await Issue.create({
        book: bookB._id,
        student: secondStudent._id,
        dueDate: new Date(Date.now() + 7 * 86400000),
        status: "ISSUED"
      });

      // studentUser queries their borrowed books
      const res = await request(app)
        .get("/api/issues/my-borrowed")
        .set("Authorization", `Bearer ${studentToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.count, 1);
      assert.equal(res.body.issues.length, 1);
      assert.equal(res.body.issues[0].book.title, "Student Book A");
    });

    it("16. Rejects unauthenticated request for borrowed books", async () => {
      const res = await request(app).get("/api/issues/my-borrowed");
      assert.equal(res.status, 401);
    });
  });

  describe("GET /api/issues/all and /api/issues - Admin View All Issues", () => {
    it("17. Admin can view all issues and filter by status", async () => {
      const book = await Book.create({
        title: "Filter Test Book",
        author: "Author",
        isbn: "9780000000011",
        category: "Test",
        publicationYear: 2021,
        totalCopies: 5,
        availableCopies: 3
      });

      await Issue.create({
        book: book._id,
        student: studentUser._id,
        dueDate: new Date(Date.now() + 7 * 86400000),
        status: "ISSUED"
      });

      await Issue.create({
        book: book._id,
        student: secondStudent._id,
        dueDate: new Date(Date.now() + 7 * 86400000),
        status: "RETURNED",
        returnDate: new Date()
      });

      // Admin gets all issues
      const resAll = await request(app)
        .get("/api/issues/all")
        .set("Authorization", `Bearer ${adminToken}`);
      assert.equal(resAll.status, 200);
      assert.equal(resAll.body.count, 2);

      // Admin filters by status=ISSUED
      const resIssued = await request(app)
        .get("/api/issues?status=ISSUED")
        .set("Authorization", `Bearer ${adminToken}`);
      assert.equal(resIssued.status, 200);
      assert.equal(resIssued.body.count, 1);
      assert.equal(resIssued.body.issues[0].status, "ISSUED");

      // Admin filters by status=RETURNED
      const resReturned = await request(app)
        .get("/api/issues?status=RETURNED")
        .set("Authorization", `Bearer ${adminToken}`);
      assert.equal(resReturned.status, 200);
      assert.equal(resReturned.body.count, 1);
      assert.equal(resReturned.body.issues[0].status, "RETURNED");
    });

    it("18. Rejects students from viewing all issues", async () => {
      const res = await request(app)
        .get("/api/issues/all")
        .set("Authorization", `Bearer ${studentToken}`);
      assert.equal(res.status, 403);
    });
  });

  describe("Concurrency Safety", () => {
    it("19. Atomic issue prevents over-issuing when only 1 copy is left", async () => {
      const book = await Book.create({
        title: "Concurrent Issue Test",
        author: "Author",
        isbn: "9780000000012",
        category: "Test",
        publicationYear: 2022,
        totalCopies: 1,
        availableCopies: 1
      });

      // Two simultaneous requests to issue the last copy to different students
      const [res1, res2] = await Promise.all([
        request(app)
          .post("/api/issues/issue")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({
            bookId: book._id.toString(),
            studentId: studentUser._id.toString()
          }),
        request(app)
          .post("/api/issues/issue")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({
            bookId: book._id.toString(),
            studentId: secondStudent._id.toString()
          })
      ]);

      const statuses = [res1.status, res2.status].sort();
      // Exactly one must succeed (201) and one must be rejected (400)
      assert.deepEqual(statuses, [201, 400]);

      const checkBook = await Book.findById(book._id);
      assert.equal(checkBook.availableCopies, 0);

      const totalIssues = await Issue.countDocuments({ book: book._id, status: "ISSUED" });
      assert.equal(totalIssues, 1);
    });

    it("20. Atomic return prevents duplicate returns on concurrent requests", async () => {
      const book = await Book.create({
        title: "Concurrent Return Test",
        author: "Author",
        isbn: "9780000000013",
        category: "Test",
        publicationYear: 2022,
        totalCopies: 2,
        availableCopies: 1
      });

      const issue = await Issue.create({
        book: book._id,
        student: studentUser._id,
        dueDate: new Date(Date.now() + 7 * 86400000),
        status: "ISSUED"
      });

      // Two simultaneous requests to return the same issue
      const [res1, res2] = await Promise.all([
        request(app)
          .post(`/api/issues/return/${issue._id}`)
          .set("Authorization", `Bearer ${adminToken}`),
        request(app)
          .post(`/api/issues/return/${issue._id}`)
          .set("Authorization", `Bearer ${adminToken}`)
      ]);

      const statuses = [res1.status, res2.status].sort();
      // Exactly one succeeds (200) and one fails with duplicate return error (400)
      assert.deepEqual(statuses, [200, 400]);

      const checkBook = await Book.findById(book._id);
      // availableCopies must be exactly 2 (incremented only once), not 3!
      assert.equal(checkBook.availableCopies, 2);
    });
  });

  describe("Regression: Book CRUD and Health Checks", () => {
    it("21. Health check returns status 200", async () => {
      const res = await request(app).get("/api/health");
      assert.equal(res.status, 200);
      assert.equal(res.body.status, "ok");
    });

    it("22. Books API returns catalogue list with search and filter", async () => {
      await Book.create({
        title: "Designing Data-Intensive Applications",
        author: "Martin Kleppmann",
        isbn: "9781449373320",
        category: "Database",
        publicationYear: 2017,
        totalCopies: 5,
        availableCopies: 5
      });

      const res = await request(app).get("/api/books?search=Kleppmann");
      assert.equal(res.status, 200);
      assert.equal(res.body.books.length, 1);
      assert.equal(res.body.books[0].title, "Designing Data-Intensive Applications");
    });
  });
});
