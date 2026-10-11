function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  // Server-side diagnostic logging (avoids logging passwords or tokens)
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message || err);

  // 1. Malformed JSON payload (from express.json())
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ message: "Invalid JSON format in request body" });
  }

  // 2. Mongoose / MongoDB CastError (e.g. invalid ObjectId format)
  if (err.name === "CastError") {
    return res.status(400).json({ message: `Invalid ${err.path || "ID"}` });
  }

  // 3. Mongoose ValidationError
  if (err.name === "ValidationError") {
    return res.status(400).json({ message: err.message });
  }

  // 4. MongoDB duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0] || "field";
    return res.status(409).json({ message: `A record with this ${field} already exists` });
  }

  // 5. JWT Authentication errors
  if (
    err.name === "JsonWebTokenError" ||
    err.name === "TokenExpiredError"
  ) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  // 6. Explicit or fallback status code
  const status = err.status || err.statusCode || 500;
  return res.status(status).json({
    message: status >= 500 ? "Internal server error" : (err.message || "An error occurred")
  });
}

export default errorHandler;
