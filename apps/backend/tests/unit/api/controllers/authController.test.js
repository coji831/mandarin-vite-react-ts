/**
 * AuthController Unit Tests
 * Tests HTTP layer for authentication endpoints with mocked AuthService
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import AuthController from "../../../../src/api/controllers/authController";

describe("AuthController", () => {
  let authController;
  let mockAuthService;
  let mockReq;
  let mockRes;

  beforeEach(() => {
    // Create mock AuthService
    mockAuthService = {
      register: vi.fn(),
      login: vi.fn(),
      refresh: vi.fn(),
      logout: vi.fn(),
      getUserById: vi.fn(),
    };

    authController = new AuthController(mockAuthService);

    // Create mock Express req/res objects
    mockReq = {
      body: {},
      cookies: {},
      headers: {},
      user: {},
      ip: "127.0.0.1",
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      cookie: vi.fn().mockReturnThis(),
      clearCookie: vi.fn().mockReturnThis(),
    };

    // Mock environment
    process.env.NODE_ENV = "test";
  });

  describe("register", () => {
    it("should register a new user successfully", async () => {
      mockReq.body = {
        email: "test@example.com",
        password: "SecurePass123",
        displayName: "Test User",
      };

      const mockResult = {
        user: { id: 1, email: "test@example.com", displayName: "Test User" },
        tokens: { accessToken: "access123", refreshToken: "refresh456" },
      };
      mockAuthService.register.mockResolvedValue(mockResult);

      await authController.register(mockReq, mockRes);

      expect(mockAuthService.register).toHaveBeenCalledWith(
        "test@example.com",
        "SecurePass123",
        "Test User",
      );
      expect(mockRes.cookie).toHaveBeenCalledWith("refreshToken", "refresh456", expect.any(Object));
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          user: mockResult.user,
          accessToken: "access123",
        },
      });
    });

    it("should return 400 when email is missing", async () => {
      mockReq.body = { password: "SecurePass123" };

      await authController.register(mockReq, mockRes);

      expect(mockAuthService.register).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Bad Request",
        code: "MISSING_FIELDS",
        message: "Email and password are required",
      });
    });

    it("should return 400 when password is missing", async () => {
      mockReq.body = { email: "test@example.com" };

      await authController.register(mockReq, mockRes);

      expect(mockAuthService.register).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should return 409 when user already exists", async () => {
      mockReq.body = { email: "existing@example.com", password: "Pass123" };
      mockAuthService.register.mockRejectedValue(new Error("User already exists"));

      await authController.register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Conflict",
        code: "USER_EXISTS",
        message: "User already exists",
      });
    });

    it("should return 400 for weak password", async () => {
      mockReq.body = { email: "test@example.com", password: "weak" };
      mockAuthService.register.mockRejectedValue(
        new Error("Password must be at least 8 characters"),
      );

      await authController.register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Bad Request",
        code: "INVALID_PASSWORD",
        message: "Password must be at least 8 characters",
      });
    });

    it("should return 500 for unexpected errors", async () => {
      mockReq.body = { email: "test@example.com", password: "Pass123" };
      mockAuthService.register.mockRejectedValue(new Error("Database error"));

      await authController.register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Internal Server Error",
        code: "REGISTRATION_FAILED",
        message: "An error occurred during registration",
      });
    });
  });

  describe("login", () => {
    it("should login successfully with valid credentials", async () => {
      mockReq.body = { email: "test@example.com", password: "Pass123" };

      const mockResult = {
        user: { id: 1, email: "test@example.com" },
        tokens: { accessToken: "access789", refreshToken: "refresh012" },
      };
      mockAuthService.login.mockResolvedValue(mockResult);

      await authController.login(mockReq, mockRes);

      expect(mockAuthService.login).toHaveBeenCalledWith("test@example.com", "Pass123");
      expect(mockRes.cookie).toHaveBeenCalledWith("refreshToken", "refresh012", expect.any(Object));
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          user: mockResult.user,
          accessToken: "access789",
        },
      });
    });

    it("should return 400 when email is missing", async () => {
      mockReq.body = { password: "Pass123" };

      await authController.login(mockReq, mockRes);

      expect(mockAuthService.login).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 when password is missing", async () => {
      mockReq.body = { email: "test@example.com" };

      await authController.login(mockReq, mockRes);

      expect(mockAuthService.login).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should return 401 for invalid credentials", async () => {
      mockReq.body = { email: "test@example.com", password: "WrongPass" };
      mockAuthService.login.mockRejectedValue(new Error("Invalid credentials"));

      await authController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Unauthorized",
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password",
      });
    });

    it("should return 500 for unexpected errors", async () => {
      mockReq.body = { email: "test@example.com", password: "Pass123" };
      mockAuthService.login.mockRejectedValue(new Error("Connection timeout"));

      await authController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Internal Server Error",
        code: "LOGIN_FAILED",
        message: "An error occurred during login",
      });
    });
  });

  describe("refresh", () => {
    it("should refresh tokens successfully from cookies", async () => {
      mockReq.cookies = { refreshToken: "oldRefresh123" };

      const mockTokens = {
        accessToken: "newAccess456",
        refreshToken: "newRefresh789",
      };
      mockAuthService.refresh.mockResolvedValue(mockTokens);

      await authController.refresh(mockReq, mockRes);

      expect(mockAuthService.refresh).toHaveBeenCalledWith("oldRefresh123");
      expect(mockRes.cookie).toHaveBeenCalledWith(
        "refreshToken",
        "newRefresh789",
        expect.any(Object),
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { accessToken: "newAccess456" },
      });
    });

    it("should parse refresh token from headers if cookies not available", async () => {
      mockReq.cookies = {};
      mockReq.headers.cookie = "refreshToken=manualRefresh123; otherCookie=value";

      const mockTokens = {
        accessToken: "newAccess",
        refreshToken: "newRefresh",
      };
      mockAuthService.refresh.mockResolvedValue(mockTokens);

      await authController.refresh(mockReq, mockRes);

      expect(mockAuthService.refresh).toHaveBeenCalledWith("manualRefresh123");
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should return 400 when refresh token is missing", async () => {
      mockReq.cookies = {};
      mockReq.headers = {};

      await authController.refresh(mockReq, mockRes);

      expect(mockAuthService.refresh).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Bad Request",
        code: "MISSING_REFRESH_TOKEN",
        message: "Refresh token is required",
      });
    });

    it("should return 401 for invalid refresh token", async () => {
      mockReq.cookies = { refreshToken: "invalidToken" };
      mockAuthService.refresh.mockRejectedValue(new Error("Invalid refresh token"));

      await authController.refresh(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Unauthorized",
        code: "INVALID_REFRESH_TOKEN",
        message: "Refresh token is invalid or expired",
      });
    });

    it("should return 500 for unexpected errors", async () => {
      mockReq.cookies = { refreshToken: "validToken" };
      mockAuthService.refresh.mockRejectedValue(new Error("Database down"));

      await authController.refresh(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Internal Server Error",
        code: "REFRESH_FAILED",
        message: "An error occurred during token refresh",
      });
    });
  });

  describe("logout", () => {
    it("should logout successfully and clear cookie", async () => {
      mockReq.cookies = { refreshToken: "logoutToken123" };
      mockAuthService.logout.mockResolvedValue();

      await authController.logout(mockReq, mockRes);

      expect(mockAuthService.logout).toHaveBeenCalledWith("logoutToken123");
      expect(mockRes.clearCookie).toHaveBeenCalledWith("refreshToken", expect.any(Object));
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Logged out successfully",
      });
    });

    it("should parse token from headers if cookies not available", async () => {
      mockReq.cookies = {};
      mockReq.headers.cookie = "refreshToken=headerToken456";
      mockAuthService.logout.mockResolvedValue();

      await authController.logout(mockReq, mockRes);

      expect(mockAuthService.logout).toHaveBeenCalledWith("headerToken456");
      expect(mockRes.clearCookie).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should return 400 and clear cookie when token is missing", async () => {
      mockReq.cookies = {};
      mockReq.headers = {};

      await authController.logout(mockReq, mockRes);

      expect(mockAuthService.logout).not.toHaveBeenCalled();
      expect(mockRes.clearCookie).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Bad Request",
        code: "MISSING_REFRESH_TOKEN",
        message: "Refresh token is required",
      });
    });

    it("should clear cookie even on service error", async () => {
      mockReq.cookies = { refreshToken: "errorToken" };
      mockAuthService.logout.mockRejectedValue(new Error("Logout failed"));

      await authController.logout(mockReq, mockRes);

      expect(mockRes.clearCookie).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Internal Server Error",
        code: "LOGOUT_FAILED",
        message: "An error occurred during logout",
      });
    });
  });

  describe("getCurrentUser", () => {
    it("should return current user successfully", async () => {
      mockReq.user = { userId: 42 };
      const mockUser = {
        id: 42,
        email: "current@example.com",
        displayName: "Current User",
      };
      mockAuthService.getUserById.mockResolvedValue(mockUser);

      await authController.getCurrentUser(mockReq, mockRes);

      expect(mockAuthService.getUserById).toHaveBeenCalledWith(42);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { user: mockUser },
      });
    });

    it("should return 404 when user not found", async () => {
      mockReq.user = { userId: 999 };
      mockAuthService.getUserById.mockResolvedValue(null);

      await authController.getCurrentUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Not Found",
        code: "USER_NOT_FOUND",
        message: "User not found",
      });
    });

    it("should return 500 for service errors", async () => {
      mockReq.user = { userId: 42 };
      mockAuthService.getUserById.mockRejectedValue(new Error("Database error"));

      await authController.getCurrentUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Internal Server Error",
        code: "GET_USER_FAILED",
        message: "An error occurred while fetching user",
      });
    });
  });

  describe("setRefreshTokenCookie", () => {
    it("should set cookie with correct settings in test environment", () => {
      authController.setRefreshTokenCookie(mockRes, "testToken123");

      expect(mockRes.cookie).toHaveBeenCalledWith("refreshToken", "testToken123", {
        httpOnly: true,
        secure: false, // test environment
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    });

    it("should set secure cookie in production", () => {
      process.env.NODE_ENV = "production";
      authController.setRefreshTokenCookie(mockRes, "prodToken456");

      expect(mockRes.cookie).toHaveBeenCalledWith("refreshToken", "prodToken456", {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    });
  });

  describe("clearRefreshTokenCookie", () => {
    it("should clear cookie with matching settings", () => {
      authController.clearRefreshTokenCookie(mockRes);

      expect(mockRes.clearCookie).toHaveBeenCalledWith("refreshToken", {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
      });
    });
  });
});
