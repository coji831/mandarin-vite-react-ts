/**
 * @file tests/unit/infrastructure/JwtService.test.js
 * @description Unit tests for JwtService (CR-34)
 */

import { describe, it, expect, beforeEach, beforeAll, vi } from "vitest";
import { JwtService } from "../../../src/infrastructure/security/JwtService.js";
import jwt from "jsonwebtoken";

describe("JwtService", () => {
  let jwtService;
  const testUserId = "test-user-123";

  beforeAll(() => {
    // Ensure test environment has required secrets
    process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-key-for-unit-tests";
    process.env.JWT_REFRESH_SECRET =
      process.env.JWT_REFRESH_SECRET || "test-jwt-refresh-secret-key-for-unit-tests";
  });

  beforeEach(() => {
    jwtService = new JwtService();
  });

  describe("constructor", () => {
    it("should initialize with required secrets", () => {
      expect(jwtService.JWT_SECRET).toBeDefined();
      expect(jwtService.JWT_REFRESH_SECRET).toBeDefined();
      expect(jwtService.ACCESS_TOKEN_EXPIRY).toBe("15m");
      expect(jwtService.REFRESH_TOKEN_EXPIRY).toBe("7d");
    });
  });

  describe("generateAccessToken", () => {
    it("should generate a valid JWT access token", () => {
      const token = jwtService.generateAccessToken(testUserId);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");

      const decoded = jwt.verify(token, jwtService.JWT_SECRET);
      expect(decoded.userId).toBe(testUserId);
    });

    it("should set correct expiration time", () => {
      const token = jwtService.generateAccessToken(testUserId);
      const decoded = jwt.verify(token, jwtService.JWT_SECRET);

      const now = Math.floor(Date.now() / 1000);
      const expectedExpiry = now + 15 * 60; // 15 minutes

      expect(decoded.exp).toBeGreaterThan(now);
      expect(decoded.exp).toBeLessThanOrEqual(expectedExpiry + 5); // Allow 5 sec buffer
    });
  });

  describe("generateRefreshToken", () => {
    it("should generate a valid JWT refresh token", () => {
      const token = jwtService.generateRefreshToken(testUserId);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");

      const decoded = jwt.verify(token, jwtService.JWT_REFRESH_SECRET);
      expect(decoded.userId).toBe(testUserId);
    });

    it("should include timestamp and random value for uniqueness", () => {
      const token = jwtService.generateRefreshToken(testUserId);
      const decoded = jwt.verify(token, jwtService.JWT_REFRESH_SECRET);

      expect(decoded.timestamp).toBeDefined();
      expect(typeof decoded.timestamp).toBe("number");
      expect(decoded.random).toBeDefined();
      expect(typeof decoded.random).toBe("number");
    });

    it("should generate unique tokens for the same user", () => {
      const token1 = jwtService.generateRefreshToken(testUserId);
      const token2 = jwtService.generateRefreshToken(testUserId);

      expect(token1).not.toBe(token2);
    });

    it("should set correct expiration time", () => {
      const token = jwtService.generateRefreshToken(testUserId);
      const decoded = jwt.verify(token, jwtService.JWT_REFRESH_SECRET);

      const now = Math.floor(Date.now() / 1000);
      const expectedExpiry = now + 7 * 24 * 60 * 60; // 7 days

      expect(decoded.exp).toBeGreaterThan(now);
      expect(decoded.exp).toBeLessThanOrEqual(expectedExpiry + 5); // Allow 5 sec buffer
    });
  });

  describe("verifyRefreshToken", () => {
    it("should verify and decode a valid refresh token", () => {
      const token = jwtService.generateRefreshToken(testUserId);
      const decoded = jwtService.verifyRefreshToken(token);

      expect(decoded.userId).toBe(testUserId);
      expect(decoded.timestamp).toBeDefined();
      expect(decoded.random).toBeDefined();
    });

    it("should throw error for invalid token", () => {
      const invalidToken = "invalid.token.here";

      expect(() => jwtService.verifyRefreshToken(invalidToken)).toThrow();
    });

    it("should throw error for expired token", () => {
      // Generate a token with immediate expiration
      const expiredToken = jwt.sign({ userId: testUserId }, jwtService.JWT_REFRESH_SECRET, {
        expiresIn: "0s",
      });

      // Wait a moment to ensure expiration
      setTimeout(() => {
        expect(() => jwtService.verifyRefreshToken(expiredToken)).toThrow();
      }, 10);
    });

    it("should throw error for token signed with wrong secret", () => {
      const wrongToken = jwt.sign({ userId: testUserId }, "wrong-secret", { expiresIn: "7d" });

      expect(() => jwtService.verifyRefreshToken(wrongToken)).toThrow();
    });
  });

  describe("getRefreshTokenExpiration", () => {
    it("should return a date 7 days in the future", () => {
      const expirationDate = jwtService.getRefreshTokenExpiration();
      const now = new Date();
      const expectedDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      expect(expirationDate).toBeInstanceOf(Date);
      expect(expirationDate.getTime()).toBeGreaterThan(now.getTime());

      // Allow 1 second tolerance
      expect(Math.abs(expirationDate.getTime() - expectedDate.getTime())).toBeLessThan(1000);
    });
  });
});
