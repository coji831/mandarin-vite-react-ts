/**
 * @file modules/auth/__tests__/AuthService.test.js
 * @description Unit tests for AuthService (CR-33)
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { AuthService } from "../services/AuthService.js";

describe("AuthService", () => {
  let authService;
  let mockRepository;
  let mockJwtService;
  let mockPasswordService;

  beforeEach(() => {
    // Mock repository
    mockRepository = {
      findUserByEmail: vi.fn(),
      findUserById: vi.fn(),
      createUser: vi.fn(),
      findSessionByToken: vi.fn(),
      createSession: vi.fn(),
      deleteSession: vi.fn(),
      deleteSessionsByToken: vi.fn(),
    };

    // Mock JWT service
    mockJwtService = {
      generateAccessToken: vi.fn(),
      generateRefreshToken: vi.fn(),
      verifyRefreshToken: vi.fn(),
      getRefreshTokenExpiration: vi.fn(),
    };

    // Mock password service
    mockPasswordService = {
      validatePassword: vi.fn(),
      hashPassword: vi.fn(),
      comparePassword: vi.fn(),
    };

    authService = new AuthService(mockRepository, mockJwtService, mockPasswordService);
  });

  describe("register", () => {
    const testEmail = "test@example.com";
    const testPassword = "ValidPass123";
    const testDisplayName = "Test User";

    it("should successfully register a new user", async () => {
      mockPasswordService.validatePassword.mockReturnValue(true);
      mockRepository.findUserByEmail.mockResolvedValue(null);
      mockPasswordService.hashPassword.mockResolvedValue("hashed-password");
      mockRepository.createUser.mockResolvedValue({
        id: "user-1",
        email: testEmail,
        passwordHash: "hashed-password",
        displayName: testDisplayName,
      });
      mockJwtService.generateAccessToken.mockReturnValue("access-token");
      mockJwtService.generateRefreshToken.mockReturnValue("refresh-token");
      mockJwtService.getRefreshTokenExpiration.mockReturnValue(new Date("2026-01-29"));

      const result = await authService.register(testEmail, testPassword, testDisplayName);

      expect(mockPasswordService.validatePassword).toHaveBeenCalledWith(testPassword);
      expect(mockRepository.findUserByEmail).toHaveBeenCalledWith(testEmail);
      expect(mockPasswordService.hashPassword).toHaveBeenCalledWith(testPassword);
      expect(mockRepository.createUser).toHaveBeenCalledWith({
        email: testEmail,
        passwordHash: "hashed-password",
        displayName: testDisplayName,
      });
      expect(result.user).toBeDefined();
      expect(result.user.passwordHash).toBeUndefined(); // Sanitized
      expect(result.tokens.accessToken).toBe("access-token");
      expect(result.tokens.refreshToken).toBe("refresh-token");
    });

    it("should reject registration with weak password", async () => {
      mockPasswordService.validatePassword.mockImplementation(() => {
        throw new Error("Password must be at least 8 characters");
      });

      await expect(authService.register(testEmail, "weak", testDisplayName)).rejects.toThrow(
        "Password must be at least 8 characters",
      );

      expect(mockRepository.findUserByEmail).not.toHaveBeenCalled();
    });

    it("should reject registration for existing user", async () => {
      mockPasswordService.validatePassword.mockReturnValue(true);
      mockRepository.findUserByEmail.mockResolvedValue({ id: "existing-user" });

      await expect(authService.register(testEmail, testPassword, testDisplayName)).rejects.toThrow(
        "User already exists",
      );

      expect(mockPasswordService.hashPassword).not.toHaveBeenCalled();
    });

    it("should create session with refresh token", async () => {
      mockPasswordService.validatePassword.mockReturnValue(true);
      mockRepository.findUserByEmail.mockResolvedValue(null);
      mockPasswordService.hashPassword.mockResolvedValue("hashed-password");
      mockRepository.createUser.mockResolvedValue({
        id: "user-1",
        email: testEmail,
        passwordHash: "hashed-password",
      });
      mockJwtService.generateAccessToken.mockReturnValue("access-token");
      mockJwtService.generateRefreshToken.mockReturnValue("refresh-token");
      const expirationDate = new Date("2026-01-29");
      mockJwtService.getRefreshTokenExpiration.mockReturnValue(expirationDate);

      await authService.register(testEmail, testPassword);

      expect(mockRepository.createSession).toHaveBeenCalledWith({
        userId: "user-1",
        refreshToken: "refresh-token",
        expiresAt: expirationDate,
      });
    });
  });

  describe("login", () => {
    const testEmail = "test@example.com";
    const testPassword = "ValidPass123";

    it("should successfully login with valid credentials", async () => {
      const mockUser = {
        id: "user-1",
        email: testEmail,
        passwordHash: "hashed-password",
        deletedAt: null,
      };
      mockRepository.findUserByEmail.mockResolvedValue(mockUser);
      mockPasswordService.comparePassword.mockResolvedValue(true);
      mockJwtService.generateAccessToken.mockReturnValue("access-token");
      mockJwtService.generateRefreshToken.mockReturnValue("refresh-token");
      mockJwtService.getRefreshTokenExpiration.mockReturnValue(new Date("2026-01-29"));

      const result = await authService.login(testEmail, testPassword);

      expect(mockRepository.findUserByEmail).toHaveBeenCalledWith(testEmail);
      expect(mockPasswordService.comparePassword).toHaveBeenCalledWith(
        testPassword,
        "hashed-password",
      );
      expect(result.user).toBeDefined();
      expect(result.user.passwordHash).toBeUndefined(); // Sanitized
      expect(result.tokens.accessToken).toBe("access-token");
      expect(result.tokens.refreshToken).toBe("refresh-token");
    });

    it("should reject login for non-existent user", async () => {
      mockRepository.findUserByEmail.mockResolvedValue(null);

      await expect(authService.login(testEmail, testPassword)).rejects.toThrow(
        "Invalid credentials",
      );

      expect(mockPasswordService.comparePassword).not.toHaveBeenCalled();
    });

    it("should reject login for deleted user", async () => {
      mockRepository.findUserByEmail.mockResolvedValue({
        id: "user-1",
        email: testEmail,
        deletedAt: new Date(),
      });

      await expect(authService.login(testEmail, testPassword)).rejects.toThrow(
        "Invalid credentials",
      );

      expect(mockPasswordService.comparePassword).not.toHaveBeenCalled();
    });

    it("should reject login with invalid password", async () => {
      mockRepository.findUserByEmail.mockResolvedValue({
        id: "user-1",
        email: testEmail,
        passwordHash: "hashed-password",
        deletedAt: null,
      });
      mockPasswordService.comparePassword.mockResolvedValue(false);

      await expect(authService.login(testEmail, testPassword)).rejects.toThrow(
        "Invalid credentials",
      );
    });
  });

  describe("refresh", () => {
    const testRefreshToken = "valid-refresh-token";
    const testUserId = "user-1";

    it("should successfully refresh tokens with valid refresh token", async () => {
      mockJwtService.verifyRefreshToken.mockReturnValue({ userId: testUserId });
      mockRepository.findSessionByToken.mockResolvedValue({
        id: "session-1",
        refreshToken: testRefreshToken,
        expiresAt: new Date("2026-06-15"),
      });
      mockJwtService.generateAccessToken.mockReturnValue("new-access-token");
      mockJwtService.generateRefreshToken.mockReturnValue("new-refresh-token");
      mockJwtService.getRefreshTokenExpiration.mockReturnValue(new Date("2026-07-01"));

      const result = await authService.refresh(testRefreshToken);

      expect(mockJwtService.verifyRefreshToken).toHaveBeenCalledWith(testRefreshToken);
      expect(mockRepository.findSessionByToken).toHaveBeenCalledWith(testRefreshToken);
      expect(mockRepository.deleteSession).toHaveBeenCalledWith("session-1");
      expect(result.accessToken).toBe("new-access-token");
      expect(result.refreshToken).toBe("new-refresh-token");
    });

    it("should reject expired session", async () => {
      mockJwtService.verifyRefreshToken.mockReturnValue({ userId: testUserId });
      mockRepository.findSessionByToken.mockResolvedValue({
        id: "session-1",
        refreshToken: testRefreshToken,
        expiresAt: new Date("2024-01-01"), // Already expired
      });

      await expect(authService.refresh(testRefreshToken)).rejects.toThrow("Invalid refresh token");
    });

    it("should reject invalid token", async () => {
      mockJwtService.verifyRefreshToken.mockImplementation(() => {
        throw new Error("Invalid token");
      });

      await expect(authService.refresh("bad-token")).rejects.toThrow("Invalid refresh token");
    });
  });

  describe("logout", () => {
    it("should delete sessions by token", async () => {
      const refreshToken = "token-to-invalidate";
      mockRepository.deleteSessionsByToken.mockResolvedValue();

      await authService.logout(refreshToken);

      expect(mockRepository.deleteSessionsByToken).toHaveBeenCalledWith(refreshToken);
    });
  });

  describe("getUserById", () => {
    it("should return sanitized user for valid ID", async () => {
      const testUser = {
        id: "user-1",
        email: "test@example.com",
        passwordHash: "secret-hash",
        deletedAt: null,
      };
      mockRepository.findUserById.mockResolvedValue(testUser);

      const result = await authService.getUserById("user-1");

      expect(result).toBeDefined();
      expect(result.passwordHash).toBeUndefined();
      expect(result.email).toBe("test@example.com");
    });

    it("should return null for non-existent user", async () => {
      mockRepository.findUserById.mockResolvedValue(null);

      const result = await authService.getUserById("nonexistent");

      expect(result).toBeNull();
    });
  });
});
