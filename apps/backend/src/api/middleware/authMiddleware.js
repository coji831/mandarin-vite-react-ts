/**
 * @file apps/backend/src/api/middleware/authMiddleware.js
 * @description JWT authentication middleware for protected routes
 */

import jwt from "jsonwebtoken";

/**
 * Verify JWT access token from Authorization header
 * Adds decoded user payload to req.user
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, email, ... }
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
