/**
 * @file apps/backend/src/api/middleware/auth.js
 * @description Authentication middleware for protecting routes
 *
 * Validates JWT access tokens and attaches userId to request
 */

import jwt from "jsonwebtoken";

/**
 * Middleware to require valid JWT access token
 * Attaches userId to req.userId if token is valid
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Unauthorized",
      code: "NO_TOKEN",
      message: "Authorization header with Bearer token required",
    });
  }

  const token = authHeader.substring(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Token expired",
        code: "TOKEN_EXPIRED",
        message: "Access token has expired. Please refresh your token.",
      });
    }

    return res.status(401).json({
      error: "Invalid token",
      code: "INVALID_TOKEN",
      message: "JWT token is invalid or malformed",
    });
  }
};

/**
 * Optional auth middleware - attaches userId if token is valid, but doesn't require it
 * Useful for endpoints that work both authenticated and unauthenticated
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.substring(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
  } catch (error) {
    // Silent fail - just don't attach userId
  }

  next();
};
