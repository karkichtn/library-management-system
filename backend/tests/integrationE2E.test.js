process.env.NODE_ENV = "test";
const JWT_SECRET = "test-secret-key-1234567890-test-secret";
process.env.JWT_SECRET = JWT_SECRET;

import { describe, it, before, after } from "node:test";
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

describe("End-to-End User Journey Integration Test (PR #16 + PR #17)", () => {
  let testBook;
  let activeIssueId;

  before(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    adminUser = await User.create({
      name: "Library Admin",
      email: "admin@library.edu",
      passwordHash: "hash123",
      role: "admin"
    });
    adminToken = generateToken(adminUser._id);

    studentUser = await User.create({
      name: "Jane Student",
      email: "jane@student.edu",
      passwordHash: "hash123",
      role: "student"
    });
    studentToken = generateToken(studentUser._id);

    secondStudent = await User.create({
      name: "John Student",
      email: "john@student.edu",
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

  it("Step 1: Start with a valid book with available copies", async () => {
    testBook = await Book.create({
      title: "Introduction to Algorithms",
      author: "CLRS",
      isbn: "9780262033848",
      category: "Computer Science",
      publicationYear: 2009,
      totalCopies: 2,
      availableCopies: 2
    });

    assert.equal(testBook.availableCopies, 2);

    // Verify catalogue listing reflects 2 available copies
    const res = await request(app).get("/api/books");
    assert.equal(res.status, 200);
    const bookInCatalogue = res.body.books.find((b) => b._id === testBook._id.toString());
    assert.ok(bookInCatalogue);
    assert.equal(bookInCatalogue.availableCopies, 2);
  });

  it("Step 2: Admin issues the book to a student", async () => {
    const issueRes = await request(app)
      .post("/api/issues/issue")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        bookId: testBook._id.toString(),
        studentId: studentUser._id.toString(),
        dueDate: "2026-11-20"
      });

    assert.equal(issueRes.status, 201);
    assert.equal(issueRes.body.message, "Book issued successfully");
    assert.equal(issueRes.body.issue.status, "ISSUED");
    activeIssueId = issueRes.body.issue._id;

    // Verify available copies decreased to 1 in database and catalogue
    const updatedBook = await Book.findById(testBook._id);
    assert.equal(updatedBook.availableCopies, 1);

    const catalogueRes = await request(app).get("/api/books");
    const bookInCatalogue = catalogueRes.body.books.find((b) => b._id === testBook._id.toString());
    assert.equal(bookInCatalogue.availableCopies, 1);
  });

  it("Step 3: Admin issues the second copy; verify book cannot be issued when 0 copies remain", async () => {
    // Issue second copy to second student
    const issue2Res = await request(app)
      .post("/api/issues/issue")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        bookId: testBook._id.toString(),
        studentId: secondStudent._id.toString(),
        dueDate: "2026-11-25"
      });
    assert.equal(issue2Res.status, 201);

    // Verify 0 copies remain
    const updatedBook = await Book.findById(testBook._id);
    assert.equal(updatedBook.availableCopies, 0);

    // Attempt to issue a 3rd copy (should fail with 400)
    const extraUser = await User.create({
      name: "Third Student",
      email: "third@student.edu",
      passwordHash: "hash123",
      role: "student"
    });

    const failRes = await request(app)
      .post("/api/issues/issue")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        bookId: testBook._id.toString(),
        studentId: extraUser._id.toString(),
        dueDate: "2026-11-30"
      });

    assert.equal(failRes.status, 400);
    assert.equal(failRes.body.message, "No copies available for this book");
  });

  it("Step 4: Return the issued book; verify success and copy count increases", async () => {
    const returnRes = await request(app)
      .post(`/api/issues/return/${activeIssueId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    assert.equal(returnRes.status, 200);
    assert.equal(returnRes.body.message, "Book returned successfully");
    assert.equal(returnRes.body.issue.status, "RETURNED");
    assert.ok(returnRes.body.issue.returnDate);

    // Verify copy count increased to 1
    const updatedBook = await Book.findById(testBook._id);
    assert.equal(updatedBook.availableCopies, 1);
  });

  it("Step 5: Attempt to return the same issue again; verify safe rejection", async () => {
    const repeatReturnRes = await request(app)
      .post(`/api/issues/return/${activeIssueId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    assert.equal(repeatReturnRes.status, 400);
    assert.equal(repeatReturnRes.body.message, "Book has already been returned");

    // Copy count remains 1, not incremented again
    const updatedBook = await Book.findById(testBook._id);
    assert.equal(updatedBook.availableCopies, 1);
  });

  it("Step 6: Verify unauthorized student cannot perform admin actions", async () => {
    const unauthorizedIssue = await request(app)
      .post("/api/issues/issue")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        bookId: testBook._id.toString(),
        studentId: studentUser._id.toString()
      });
    assert.equal(unauthorizedIssue.status, 403);
    assert.equal(unauthorizedIssue.body.message, "Admin access required");

    const unauthorizedReturn = await request(app)
      .post(`/api/issues/return/${activeIssueId}`)
      .set("Authorization", `Bearer ${studentToken}`);
    assert.equal(unauthorizedReturn.status, 403);
    assert.equal(unauthorizedReturn.body.message, "Admin access required");
  });

  it("Step 7: Student can view their own loans in 'my-borrowed' records", async () => {
    const studentLoansRes = await request(app)
      .get("/api/issues/my-borrowed")
      .set("Authorization", `Bearer ${studentToken}`);

    assert.equal(studentLoansRes.status, 200);
    assert.equal(studentLoansRes.body.count, 1);
    assert.equal(studentLoansRes.body.issues[0]._id, activeIssueId);
    assert.equal(studentLoansRes.body.issues[0].status, "RETURNED");
  });
});
