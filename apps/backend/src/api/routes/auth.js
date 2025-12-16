/**
 * @file apps/backend/src/api/routes/auth.js
 * @description Authentication routes
 */

import express from "express";
import { rateLimit } from "express-rate-limit";
import * as authController from "../controllers/authController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Rate limiter for auth endpoints (prevent brute force attacks)
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Max 5 requests per minute per IP
  message: {
    error: "Too Many Requests",
    code: "RATE_LIMIT_EXCEEDED",
    message: "Too many authentication attempts. Please try again later.",
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
});

// Apply rate limiting to login and register (most vulnerable to brute force)
router.post("/register", authLimiter, authController.register);
router.post("/login", authLimiter, authController.login);

// Refresh and logout don't need rate limiting (already authenticated)
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);

// Protected route - get current user
router.get("/me", authenticateToken, authController.getCurrentUser);

export default router;
