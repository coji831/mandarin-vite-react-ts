/**
 * @file apps/backend/tests/auth.test.js
 * @description Tests for authentication service and endpoints
 */

import { describe, test, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { AuthService } from "../../src/core/services/AuthService.js";
import { prisma } from "../../src/infrastructure/database/client.js";
import bcrypt from "bcrypt";

describe("AuthService", () => {
  let authService;
  let testUserEmail;

  beforeAll(() => {
    authService = new AuthService();
  });

  beforeEach(() => {
    testUserEmail = `test-auth-${Date.now()}@example.com`;
  });

  afterAll(async () => {
    // Clean up test users
    await prisma.user.deleteMany({
      where: { email: { contains: "test-auth-" } },
    });
    await prisma.$disconnect();
  });

  describe("register", () => {
    test("successfully registers new user with valid password", async () => {
      const result = await authService.register(testUserEmail, "ValidPass123!", "Test User");

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(testUserEmail);
      expect(result.user.displayName).toBe("Test User");
      expect(result.user.passwordHash).toBeUndefined(); // Should be sanitized
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
    });

    test("rejects weak password (no uppercase)", async () => {
      await expect(authService.register(testUserEmail, "weakpass123", "Test")).rejects.toThrow(
        "Password must be at least 8 characters",
      );
    });

    test("rejects weak password (no lowercase)", async () => {
      await expect(authService.register(testUserEmail, "WEAKPASS123", "Test")).rejects.toThrow(
        "Password must be at least 8 characters",
      );
    });

    test("rejects weak password (no number)", async () => {
      await expect(authService.register(testUserEmail, "WeakPassword", "Test")).rejects.toThrow(
        "Password must be at least 8 characters",
      );
    });

    test("rejects weak password (too short)", async () => {
      await expect(authService.register(testUserEmail, "Pass1", "Test")).rejects.toThrow(
        "Password must be at least 8 characters",
      );
    });

    test("rejects duplicate email", async () => {
      await authService.register(testUserEmail, "ValidPass123!", "Test");

      await expect(authService.register(testUserEmail, "ValidPass123!", "Test2")).rejects.toThrow(
        "User already exists",
      );
    });

    test("hashes password correctly", async () => {
      const password = "SecurePass123!";
      const result = await authService.register(testUserEmail, password, "Test");

      const user = await prisma.user.findUnique({
        where: { email: testUserEmail },
      });

      expect(user.passwordHash).toBeDefined();
      expect(user.passwordHash).not.toBe(password);

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      expect(isMatch).toBe(true);
    });

    test("stores refresh token in database", async () => {
      const result = await authService.register(testUserEmail, "ValidPass123!", "Test");

      const session = await prisma.session.findUnique({
        where: { refreshToken: result.tokens.refreshToken },
      });

      expect(session).toBeDefined();
      expect(session.userId).toBe(result.user.id);
    });
  });

  describe("login", () => {
    beforeEach(async () => {
      // Create test user
      await authService.register(testUserEmail, "LoginTest123!", "Test User");
    });

    test("successfully logs in with valid credentials", async () => {
      const result = await authService.login(testUserEmail, "LoginTest123!");

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(testUserEmail);
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
    });

    test("rejects invalid email", async () => {
      await expect(authService.login("nonexistent@example.com", "LoginTest123!")).rejects.toThrow(
        "Invalid credentials",
      );
    });

    test("rejects invalid password", async () => {
      await expect(authService.login(testUserEmail, "WrongPassword123!")).rejects.toThrow(
        "Invalid credentials",
      );
    });

    test("rejects soft-deleted user", async () => {
      // Soft delete user
      await prisma.user.update({
        where: { email: testUserEmail },
        data: { deletedAt: new Date() },
      });

      await expect(authService.login(testUserEmail, "LoginTest123!")).rejects.toThrow(
        "Invalid credentials",
      );
    });
  });

  describe("refresh", () => {
    let refreshToken;
    let userId;

    beforeEach(async () => {
      const result = await authService.register(testUserEmail, "RefreshTest123!", "Test");
      refreshToken = result.tokens.refreshToken;
      userId = result.user.id;
    });

    test("successfully refreshes tokens with valid refresh token", async () => {
      const newTokens = await authService.refresh(refreshToken);

      expect(newTokens.accessToken).toBeDefined();
      expect(newTokens.refreshToken).toBeDefined();
      expect(newTokens.refreshToken).not.toBe(refreshToken); // Token rotation
    });

    test("deletes old refresh token after refresh (token rotation)", async () => {
      await authService.refresh(refreshToken);

      const oldSession = await prisma.session.findUnique({
        where: { refreshToken },
      });

      expect(oldSession).toBeNull();
    });

    test("rejects invalid refresh token", async () => {
      await expect(authService.refresh("invalid-token-12345")).rejects.toThrow(
        "Invalid refresh token",
      );
    });

    test("rejects expired refresh token", async () => {
      // Create expired session
      await prisma.session.create({
        data: {
          userId,
          refreshToken: "expired-token",
          expiresAt: new Date(Date.now() - 1000), // 1 second ago
        },
      });

      await expect(authService.refresh("expired-token")).rejects.toThrow("Invalid refresh token");
    });
  });

  describe("logout", () => {
    let refreshToken;

    beforeEach(async () => {
      const result = await authService.register(testUserEmail, "LogoutTest123!", "Test");
      refreshToken = result.tokens.refreshToken;
    });

    test("successfully invalidates refresh token", async () => {
      await authService.logout(refreshToken);

      const session = await prisma.session.findUnique({
        where: { refreshToken },
      });

      expect(session).toBeNull();
    });

    test("does not throw error if token doesn't exist", async () => {
      await expect(authService.logout("non-existent-token")).resolves.not.toThrow();
    });
  });

  describe("sanitizeUser", () => {
    test("removes sensitive fields from user object", () => {
      const user = {
        id: "123",
        email: "test@example.com",
        passwordHash: "hashed-password",
        displayName: "Test",
        deletedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const sanitized = authService.sanitizeUser(user);

      expect(sanitized.passwordHash).toBeUndefined();
      expect(sanitized.deletedAt).toBeUndefined();
      expect(sanitized.id).toBe("123");
      expect(sanitized.email).toBe("test@example.com");
    });
  });
});
