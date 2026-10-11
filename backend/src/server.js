import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";
import issueRoutes from "./routes/issueRoutes.js";

import notFoundHandler from "./middleware/notFoundHandler.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" })
);
app.use(express.json());

app.get("/api/health", (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  return res.status(connected ? 200 : 503).json({
    status: connected ? "ok" : "database unavailable",
    message: "Library Management System API"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/issues", issueRoutes);

// Test routes to verify centralized error-handling middleware through the Express pipeline
if (process.env.NODE_ENV === "test") {
  app.get("/api/test-errors/unexpected", (req, res, next) => {
    const error = new Error("Simulated database failure");
    error.stack = "Error: Simulated database failure\nat db.js:10";
    next(error);
  });

  app.get("/api/test-errors/validation", (req, res, next) => {
    const error = new Error("Book validation failed: title is required");
    error.name = "ValidationError";
    next(error);
  });

  app.get("/api/test-errors/cast", (req, res, next) => {
    const error = new Error("Cast to ObjectId failed for value invalid-id");
    error.name = "CastError";
    error.path = "id";
    next(error);
  });

  app.get("/api/test-errors/duplicate", (req, res, next) => {
    const error = new Error("E11000 duplicate key error");
    error.code = 11000;
    error.keyPattern = { isbn: 1 };
    next(error);
  });
}

// 404 handler for unknown routes (registered after all routes)
app.use(notFoundHandler);

// Centralized error handler (registered last with 4 arguments)
app.use(errorHandler);

async function startServer() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing from backend/.env");
  }
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

const isTestEnvironment =
  process.env.NODE_ENV === "test" ||
  process.execArgv.includes("--test");

if (!isTestEnvironment) {
  startServer().catch((error) => {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  });
}

export default app;
