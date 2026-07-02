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
): void | Response<any, Record<string, any>> {
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
    const decoded = jwt.verify(token, config.jwtSecret as string);
    req.user = decoded as { userId: string; email?: string } & Record<string, unknown>;
    req.userId = (decoded as any).userId; // Convenience field for controllers
    next();
  } catch (error) {
    if ((error as any).name === "TokenExpiredError") {
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
    const decoded = jwt.verify(token, config.jwtSecret as string);
    req.user = decoded as { userId: string; email?: string } & Record<string, unknown>;
    req.userId = (decoded as any).userId;
  } catch (error) {
    // Token invalid or expired - continue without user
  }

  next();
}

export default { authenticateToken, optionalAuth };
