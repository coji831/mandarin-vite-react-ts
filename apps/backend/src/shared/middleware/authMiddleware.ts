/**
 * @file apps/backend/src/shared/middleware/authMiddleware.js
 * @description JWT authentication middleware for protected routes
 * Clean architecture: API layer middleware
 */

import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import type { Request, Response, NextFunction } from "express";

/**
 * Require valid JWT access token
 * Attaches decoded user payload to req.user
 */
export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction,
): void | Response<Record<string, unknown>, Record<string, unknown>> {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: "Unauthorized",
      code: "MISSING_TOKEN",
      message: "Access token is required",
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret!);
    req.user = decoded as { userId: string; email?: string } & Record<string, unknown>;
    req.userId = (decoded as { userId: string }).userId; // Convenience field for controllers
    next();
  } catch (error) {
    if (error instanceof Error && error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Unauthorized",
        code: "TOKEN_EXPIRED",
        message: "Access token has expired",
      });
    }

    return res.status(403).json({
      error: "Forbidden",
      code: "INVALID_TOKEN",
      message: "Invalid access token",
    });
  }
}

/**
 * Optional auth - attaches user if token valid, but doesn't require it
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret!);
    req.user = decoded as { userId: string; email?: string } & Record<string, unknown>;
    req.userId = (decoded as { userId: string }).userId;
  } catch {
    // Token invalid or expired - continue without user
  }

  next();
}

/**
 * Require valid authentication - rejects guests with 401.
 * Reuses authenticateToken logic but with user-friendly messaging.
 * Use for endpoints that must have a registered user (SRS, progress persistence, AI feedback).
 */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void | Response<Record<string, unknown>, Record<string, unknown>> {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      error: "Authentication required",
      code: "AUTH_REQUIRED",
      message: "Please sign in to access this feature",
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret!);
    req.user = decoded as { userId: string; email?: string } & Record<string, unknown>;
    req.userId = (decoded as { userId: string }).userId;
    next();
  } catch (error) {
    if (error instanceof Error && error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Authentication required",
        code: "TOKEN_EXPIRED",
        message: "Your session has expired. Please sign in again.",
      });
    }

    return res.status(403).json({
      error: "Forbidden",
      code: "INVALID_TOKEN",
      message: "Invalid access token",
    });
  }
}

export default { authenticateToken, optionalAuth, requireAuth };
