/**
 * @file apps/backend/src/shared/middleware/errorHandler.js
 * @description Express error handler middleware with request ID propagation
 * Clean architecture: API layer middleware
 */

import { v4 as uuidv4 } from "uuid";
import { createLogger } from "../utils/logger.js";
import type { Request, Response, NextFunction } from "express";

const logger = createLogger("ErrorHandler");

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  req.requestId = (req.headers["x-request-id"] as string) || uuidv4();
  res.setHeader("X-Request-Id", req.requestId);
  next();
}

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  const requestId = req.requestId || uuidv4();
  const error = {
    code: err.code || "INTERNAL_ERROR",
    message: err.message || "An unexpected error occurred",
    requestId,
  };

  // Log error with requestId using standard logger
  logger.error("API Error", {
    requestId,
    code: error.code,
    message: error.message,
    stack: err.stack,
  });

  res.status(err.status || 500).json(error);
}
