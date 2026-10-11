import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { setupTestDB, clearTestDB, teardownTestDB } from "./helpers/testDb.js";
import Book from "../src/models/Book.js";
import { seedBooks, demoBooks } from "../src/scripts/seedBooks.js";

describe("Preset Books Seeder (seedBooks.js)", () => {
  before(async () => {
    await setupTestDB();
  });

  after(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  it("1. seeds exactly 30 demo books into a fresh database", async () => {
    assert.equal(demoBooks.length, 30, "Demo books array must contain exactly 30 records");

    const result = await seedBooks();

    assert.equal(result.totalTarget, 30);
    assert.equal(result.insertedCount, 30);
    assert.equal(result.skippedCount, 0);
    assert.equal(result.totalInDb, 30);

    const countInDb = await Book.countDocuments();
    assert.equal(countInDb, 30);
  });

  it("2. every inserted document satisfies the Book schema with valid fields", async () => {
    await seedBooks();
    const books = await Book.find().lean();

    assert.equal(books.length, 30);
    const currentYear = new Date().getFullYear();

    for (const book of books) {
      assert.ok(typeof book.title === "string" && book.title.length > 0, "Title is required");
      assert.ok(typeof book.author === "string" && book.author.length > 0, "Author is required");
      assert.ok(typeof book.isbn === "string" && book.isbn.length > 0, "ISBN is required");
      assert.ok(typeof book.category === "string" && book.category.length > 0, "Category is required");

      assert.ok(
        Number.isInteger(book.publicationYear) && book.publicationYear <= currentYear,
        `Publication year ${book.publicationYear} must be an integer <= ${currentYear}`
      );
      assert.ok(
        Number.isInteger(book.totalCopies) && book.totalCopies >= 0,
        `Total copies ${book.totalCopies} must be non-negative integer`
      );
      assert.ok(
        Number.isInteger(book.availableCopies) &&
          book.availableCopies >= 0 &&
          book.availableCopies <= book.totalCopies,
        `Available copies ${book.availableCopies} must be between 0 and total copies ${book.totalCopies}`
      );
    }
  });

  it("3. every demo book record has a unique ISBN", async () => {
    const isbns = demoBooks.map((b) => b.isbn.trim());
    const uniqueIsbns = new Set(isbns);

    assert.equal(uniqueIsbns.size, 30, "All 30 ISBNs must be unique");
  });

  it("4. running the seed process twice is strictly idempotent (no duplicates)", async () => {
    const firstResult = await seedBooks();
    assert.equal(firstResult.insertedCount, 30);
    assert.equal(firstResult.skippedCount, 0);

    const secondResult = await seedBooks();
    assert.equal(secondResult.insertedCount, 0, "Second run should insert 0 new records");
    assert.equal(secondResult.skippedCount, 30, "Second run should skip all 30 existing records");
    assert.equal(secondResult.totalInDb, 30, "Total count in DB must remain exactly 30");

    const countInDb = await Book.countDocuments();
    assert.equal(countInDb, 30);
  });

  it("5. existing non-seed records remain completely untouched", async () => {
    const customBook = await Book.create({
      title: "Custom User Book",
      author: "Local Professor",
      isbn: "978-9999999999",
      category: "Special Collection",
      publicationYear: 2023,
      totalCopies: 3,
      availableCopies: 2
    });

    const result = await seedBooks();

    assert.equal(result.insertedCount, 30);
    assert.equal(result.totalInDb, 31);

    const verifiedCustom = await Book.findOne({ isbn: "978-9999999999" });
    assert.ok(verifiedCustom, "Pre-existing book must still exist");
    assert.equal(verifiedCustom.title, "Custom User Book");
    assert.equal(verifiedCustom.availableCopies, 2);
  });

  it("6. rejects seed batches containing invalid records or internal duplicates", async () => {
    const invalidBatch = [
      {
        title: "Bad Book",
        author: "Nobody",
        isbn: "978-0000000001",
        category: "Test",
        publicationYear: 2020,
        totalCopies: 2,
        availableCopies: 5 // Exceeds totalCopies
      }
    ];

    await assert.rejects(
      async () => {
        await seedBooks(invalidBatch);
      },
      /Available copies cannot exceed total copies|validation failed/i
    );

    const duplicateBatch = [
      {
        title: "Book A",
        author: "Author A",
        isbn: "978-1111111111",
        category: "Test",
        publicationYear: 2020,
        totalCopies: 1,
        availableCopies: 1
      },
      {
        title: "Book B",
        author: "Author B",
        isbn: "978-1111111111", // Duplicate within same batch
        category: "Test",
        publicationYear: 2020,
        totalCopies: 1,
        availableCopies: 1
      }
    ];

    await assert.rejects(
      async () => {
        await seedBooks(duplicateBatch);
      },
      /Duplicate ISBN found in seed dataset/i
    );
  });
});
