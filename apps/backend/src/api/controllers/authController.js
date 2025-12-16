/**
 * @file apps/backend/src/api/controllers/authController.js
 * @description Authentication controller handling HTTP requests for auth endpoints
 */

import { AuthService } from "../../core/services/AuthService.js";
import { createLogger } from "../../../utils/logger.js";

const authService = new AuthService();
const logger = createLogger("AuthController");

/**
 * Helper to set refresh token cookie with consistent settings
 */
function setRefreshTokenCookie(res, refreshToken) {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

/**
 * Helper to clear refresh token cookie with matching settings
 */
function clearRefreshTokenCookie(res) {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    path: "/",
  });
}

/**
 * Register new user
 * POST /api/v1/auth/register
 * Body: { email, password, displayName? }
 */
export const register = async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Bad Request",
        code: "MISSING_FIELDS",
        message: "Email and password are required",
      });
    }

    const result = await authService.register(email, password, displayName);

    logger.info("User registered successfully", { email, ip: req.ip });

    // Set refresh token as httpOnly cookie
    setRefreshTokenCookie(res, result.tokens.refreshToken);

    res.status(201).json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.tokens.accessToken,
      },
    });
  } catch (error) {
    if (error.message === "User already exists") {
      logger.warn("Registration failed - user exists", { email, ip: req.ip });
      return res.status(409).json({
        error: "Conflict",
        code: "USER_EXISTS",
        message: error.message,
      });
    }

    if (error.message.includes("Password must be")) {
      logger.warn("Registration failed - weak password", { email, ip: req.ip });
      return res.status(400).json({
        error: "Bad Request",
        code: "INVALID_PASSWORD",
        message: error.message,
      });
    }

    logger.error("Registration error", { error: error.message, email, ip: req.ip });
    res.status(500).json({
      error: "Internal Server Error",
      code: "REGISTRATION_FAILED",
      message: "An error occurred during registration",
    });
  }
};

/**
 * Login existing user
 * POST /api/v1/auth/login
 * Body: { email, password }
 */
export const login = async (req, res) => {
  let email; // Declare outside try block for error logging
  try {
    email = req.body.email;
    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Bad Request",
        code: "MISSING_FIELDS",
        message: "Email and password are required",
      });
    }

    const result = await authService.login(email, password);

    logger.info("User logged in successfully", { email, ip: req.ip });

    // Set refresh token as httpOnly cookie
    setRefreshTokenCookie(res, result.tokens.refreshToken);

    res.status(200).json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.tokens.accessToken,
      },
    });
  } catch (error) {
    if (error.message === "Invalid credentials") {
      logger.warn("Login failed - invalid credentials", {
        email,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      });
      return res.status(401).json({
        error: "Unauthorized",
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password",
      });
    }

    logger.error("Login error", { error: error.message, email, ip: req.ip });
    res.status(500).json({
      error: "Internal Server Error",
      code: "LOGIN_FAILED",
      message: "An error occurred during login",
    });
  }
};

/**
 * Refresh access token
 * POST /api/v1/auth/refresh
 * Body: { refreshToken }
 */
export const refresh = async (req, res) => {
  try {
    console.log("[DEBUG] Refresh request headers.cookie:", req.headers.cookie);
    console.log("[DEBUG] Parsed req.cookies:", req.cookies);

    // Read refresh token from httpOnly cookie (fallback to manual parsing if middleware fails)
    let refreshToken = req.cookies?.refreshToken;

    if (!refreshToken && req.headers.cookie) {
      // Manual cookie parsing as fallback
      const cookies = req.headers.cookie.split(";").reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split("=");
        acc[key] = value;
        return acc;
      }, {});
      refreshToken = cookies.refreshToken;
      console.log("[DEBUG] Manually parsed cookies:", cookies);
    }

    if (!refreshToken) {
      return res.status(400).json({
        error: "Bad Request",
        code: "MISSING_REFRESH_TOKEN",
        message: "Refresh token is required",
      });
    }

    const tokens = await authService.refresh(refreshToken);

    // Set new refresh token as httpOnly cookie
    setRefreshTokenCookie(res, tokens.refreshToken);

    res.status(200).json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
      },
    });
  } catch (error) {
    if (error.message === "Invalid refresh token") {
      return res.status(401).json({
        error: "Unauthorized",
        code: "INVALID_REFRESH_TOKEN",
        message: "Refresh token is invalid or expired",
      });
    }

    console.error("Token refresh error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      code: "REFRESH_FAILED",
      message: "An error occurred during token refresh",
    });
  }
};

/**
 * Logout user
 * POST /api/v1/auth/logout
 * Body: { refreshToken }
 */
export const logout = async (req, res) => {
  try {
    console.log("[DEBUG] Logout request headers.cookie:", req.headers.cookie);
    console.log("[DEBUG] Parsed req.cookies:", req.cookies);

    // Read refresh token from httpOnly cookie (with manual parsing fallback)
    let refreshToken = req.cookies?.refreshToken;

    if (!refreshToken && req.headers.cookie) {
      const cookies = req.headers.cookie.split(";").reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split("=");
        acc[key] = value;
        return acc;
      }, {});
      refreshToken = cookies.refreshToken;
      console.log("[DEBUG] Manually parsed logout cookies:", cookies);
    }

    if (!refreshToken) {
      // Even if no token, still clear the cookie
      clearRefreshTokenCookie(res);
      return res.status(400).json({
        error: "Bad Request",
        code: "MISSING_REFRESH_TOKEN",
        message: "Refresh token is required",
      });
    }

    await authService.logout(refreshToken);

    // Clear the httpOnly cookie using helper
    console.log("[DEBUG] Clearing refresh token cookie...");
    clearRefreshTokenCookie(res);

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    // Always try to clear cookie even on error
    clearRefreshTokenCookie(res);
    res.status(500).json({
      error: "Internal Server Error",
      code: "LOGOUT_FAILED",
      message: "An error occurred during logout",
    });
  }
};

/**
 * Get current user
 * GET /api/v1/auth/me
 * Headers: { Authorization: Bearer <token> }
 */
export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await authService.getUserById(userId);

    if (!user) {
      return res.status(404).json({
        error: "Not Found",
        code: "USER_NOT_FOUND",
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      code: "GET_USER_FAILED",
      message: "An error occurred while fetching user",
    });
  }
};
