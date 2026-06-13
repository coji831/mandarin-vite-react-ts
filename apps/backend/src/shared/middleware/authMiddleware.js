/**
 * @file apps/backend/src/shared/middleware/authMiddleware.js
 * @description JWT authentication middleware for protected routes
 * Clean architecture: API layer middleware
 */

import jwt from "jsonwebtoken";
import { config } from "../config/index.js";

/**
 * Require valid JWT access token
 * Attaches decoded user payload to req.user
 */
export function authenticateToken(req, res, next) {
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
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded; // { userId, email, ... }
    req.userId = decoded.userId; // Convenience field for controllers
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
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
export function optionalAuth(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    req.userId = decoded.userId;
  } catch (error) {
    // Token invalid or expired - continue without user
  }

  next();
}

export default { authenticateToken, optionalAuth };
