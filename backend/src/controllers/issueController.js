import mongoose from "mongoose";
import Issue from "../models/Issue.js";
import Book from "../models/Book.js";
import User from "../models/User.js";

export async function issueBook(req, res) {
  try {
    const rawBookId = req.body.bookId || req.body.book;
    const rawStudentId = req.body.studentId || req.body.student;
    const bookId = typeof rawBookId === "string" ? rawBookId.trim() : rawBookId;
    const studentId = typeof rawStudentId === "string" ? rawStudentId.trim() : rawStudentId;
    const { dueDate } = req.body;

    if (!bookId || !studentId) {
      return res.status(400).json({ message: "Book and student are required" });
    }

    if (!mongoose.isValidObjectId(bookId) || !mongoose.isValidObjectId(studentId)) {
      return res.status(400).json({ message: "Invalid book or student ID" });
    }

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const activeIssue = await Issue.findOne({
      book: bookId,
      student: studentId,
      status: "ISSUED"
    });

    if (activeIssue) {
      return res.status(400).json({ message: "Student already has an active issue for this book" });
    }

    let returnDue;
    if (dueDate) {
      returnDue = new Date(dueDate);
      if (isNaN(returnDue.getTime())) {
        return res.status(400).json({ message: "Invalid due date" });
      }
    } else {
      returnDue = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    }

    // Atomically decrement availableCopies if copies are available
    const book = await Book.findOneAndUpdate(
      { _id: bookId, availableCopies: { $gt: 0 } },
      { $inc: { availableCopies: -1 } },
      { new: true }
    );

    if (!book) {
      const exists = await Book.findById(bookId);
      if (!exists) {
        return res.status(404).json({ message: "Book not found" });
      }
      return res.status(400).json({ message: "No copies available for this book" });
    }

    let issue;
    try {
      issue = new Issue({
        book: bookId,
        student: studentId,
        dueDate: returnDue
      });
      await issue.save();
    } catch (saveError) {
      // Rollback copy decrement if issue creation failed
      await Book.findByIdAndUpdate(bookId, { $inc: { availableCopies: 1 } });
      throw saveError;
    }

    await issue.populate("book", "title author isbn category");
    await issue.populate("student", "name email");

    return res.status(201).json({
      message: "Book issued successfully",
      issue
    });
  } catch (error) {
    console.error("Error issuing book:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function returnBook(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid issue ID" });
    }

    // Atomically update status to RETURNED only if currently ISSUED
    const issue = await Issue.findOneAndUpdate(
      { _id: id, status: "ISSUED" },
      { status: "RETURNED", returnDate: new Date() },
      { new: true }
    );

    if (!issue) {
      const existingIssue = await Issue.findById(id);
      if (!existingIssue) {
        return res.status(404).json({ message: "Issue record not found" });
      }
      return res.status(400).json({ message: "Book has already been returned" });
    }

    const book = await Book.findById(issue.book);
    if (book) {
      if (book.availableCopies < book.totalCopies) {
        book.availableCopies += 1;
        await book.save();
      }
    }

    await issue.populate("book", "title author isbn category");
    await issue.populate("student", "name email");

    return res.status(200).json({
      message: "Book returned successfully",
      issue
    });
  } catch (error) {
    console.error("Error returning book:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getMyBorrowedBooks(req, res) {
  try {
    const filter = { student: req.user._id };
    if (req.query.status) {
      filter.status = req.query.status.toUpperCase();
    }

    const issues = await Issue.find(filter)
      .populate("book", "title author isbn category")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: issues.length,
      issues
    });
  } catch (error) {
    console.error("Error fetching borrowed books:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getAllIssues(req, res) {
  try {
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status.toUpperCase();
    }

    const issues = await Issue.find(filter)
      .populate("book", "title author isbn category")
      .populate("student", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: issues.length,
      issues
    });
  } catch (error) {
    console.error("Error fetching issue records:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
