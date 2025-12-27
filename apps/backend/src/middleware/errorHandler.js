// local-backend/utils/errorHandler.js
// Express error handler middleware with request ID propagation and structured error object
import { v4 as uuidv4 } from "uuid";

export function requestIdMiddleware(req, res, next) {
  req.requestId = req.headers["x-request-id"] || uuidv4();
  res.setHeader("X-Request-Id", req.requestId);
  next();
}

export function errorHandler(err, req, res, next) {
  const requestId = req.requestId || uuidv4();
  const error = {
    code: err.code || "INTERNAL_ERROR",
    message: err.message || "An unexpected error occurred",
    requestId,
  };
  // Log error with requestId
  logError(error);
  res.status(err.status || 500).json(error);
}

// Optionally, export a logging utility for centralized error reporting
export function logError(error) {
  // Integrate with Sentry, cloud logging, or just use console
  console.error("[API Error]", error);
}
