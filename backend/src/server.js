import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";

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

app.use(notFoundHandler);
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
