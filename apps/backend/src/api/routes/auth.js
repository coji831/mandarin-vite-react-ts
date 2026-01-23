/**
 * @file apps/backend/src/api/routes/auth.js
 * @description Authentication routes
 */

import express from "express";
import { rateLimit } from "express-rate-limit";
import AuthController from "../controllers/authController.js";
import { AuthService } from "../../core/services/AuthService.js";
import { AuthRepository } from "../../infrastructure/repositories/AuthRepository.js";
import { JwtService } from "../../infrastructure/security/JwtService.js";
import { PasswordService } from "../../infrastructure/security/PasswordService.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";

const router = express.Router();

// Initialize dependencies
const authRepository = new AuthRepository();
const jwtService = new JwtService();
const passwordService = new PasswordService();
const authService = new AuthService(authRepository, jwtService, passwordService);
const authController = new AuthController(authService);

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
// OpenAPI spec: see docs/openapi.yaml#/paths/~1v1~1auth~1register
router.post(
  ROUTE_PATTERNS.authRegister,
  authLimiter,
  asyncHandler(authController.register.bind(authController)),
);

// OpenAPI spec: see docs/openapi.yaml#/paths/~1v1~1auth~1login
router.post(
  ROUTE_PATTERNS.authLogin,
  authLimiter,
  asyncHandler(authController.login.bind(authController)),
);

// OpenAPI spec: see docs/openapi.yaml#/paths/~1v1~1auth~1refresh
router.post(ROUTE_PATTERNS.authRefresh, asyncHandler(authController.refresh.bind(authController)));

// OpenAPI spec: see docs/openapi.yaml#/paths/~1v1~1auth~1logout
router.post(ROUTE_PATTERNS.authLogout, asyncHandler(authController.logout.bind(authController)));

// OpenAPI spec: see docs/openapi.yaml#/paths/~1v1~1auth~1me
router.get(
  ROUTE_PATTERNS.authMe,
  authenticateToken,
  asyncHandler(authController.getCurrentUser.bind(authController)),
);

export default router;
