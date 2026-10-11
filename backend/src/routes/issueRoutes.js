import express from "express";
import {
  issueBook,
  returnBook,
  getMyBorrowedBooks,
  getAllIssues
} from "../controllers/issueController.js";
import authenticateUser from "../middleware/authenticateUser.js";
import requireAdmin from "../middleware/requireAdmin.js";

const router = express.Router();

router.post("/issue", authenticateUser, requireAdmin, issueBook);
router.post("/return/:id", authenticateUser, requireAdmin, returnBook);
router.get("/my-borrowed", authenticateUser, getMyBorrowedBooks);
router.get("/all", authenticateUser, requireAdmin, getAllIssues);
router.get("/", authenticateUser, requireAdmin, getAllIssues);

export default router;
