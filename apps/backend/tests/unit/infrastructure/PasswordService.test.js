/**
 * @file tests/unit/infrastructure/PasswordService.test.js
 * @description Unit tests for PasswordService (CR-34)
 */

import { describe, it, expect, beforeEach } from "vitest";
import { PasswordService } from "../../../src/infrastructure/security/PasswordService.js";

describe("PasswordService", () => {
  let passwordService;

  beforeEach(() => {
    passwordService = new PasswordService();
  });

  describe("constructor", () => {
    it("should initialize with correct salt rounds", () => {
      expect(passwordService.SALT_ROUNDS).toBe(10);
    });
  });

  describe("validatePassword", () => {
    it("should accept valid password with all requirements", () => {
      expect(() => passwordService.validatePassword("ValidPass123")).not.toThrow();
      expect(passwordService.validatePassword("ValidPass123")).toBe(true);
    });

    it("should accept password with special characters", () => {
      expect(() => passwordService.validatePassword("ValidPass123!@#")).not.toThrow();
    });

    it("should reject password without uppercase", () => {
      expect(() => passwordService.validatePassword("weakpass123")).toThrow(
        "Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number",
      );
    });

    it("should reject password without lowercase", () => {
      expect(() => passwordService.validatePassword("WEAKPASS123")).toThrow(
        "Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number",
      );
    });

    it("should reject password without number", () => {
      expect(() => passwordService.validatePassword("WeakPassword")).toThrow(
        "Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number",
      );
    });

    it("should reject password shorter than 8 characters", () => {
      expect(() => passwordService.validatePassword("Pass12")).toThrow(
        "Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number",
      );
    });

    it("should accept exactly 8 characters if all requirements met", () => {
      expect(() => passwordService.validatePassword("Pass1234")).not.toThrow();
    });

    it("should accept long password with all requirements", () => {
      expect(() => passwordService.validatePassword("VeryLongPassword123456789")).not.toThrow();
    });
  });

  describe("hashPassword", () => {
    it("should hash password to bcrypt format", async () => {
      const plainPassword = "TestPass123";
      const hash = await passwordService.hashPassword(plainPassword);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe("string");
      expect(hash).toMatch(/^\$2[aby]\$/); // bcrypt format starts with $2a$, $2b$, or $2y$
      expect(hash.length).toBeGreaterThan(50); // bcrypt hashes are typically 60 characters
    });

    it("should generate different hashes for same password", async () => {
      const plainPassword = "TestPass123";
      const hash1 = await passwordService.hashPassword(plainPassword);
      const hash2 = await passwordService.hashPassword(plainPassword);

      expect(hash1).not.toBe(hash2); // Due to random salt
    });

    it("should hash different passwords to different hashes", async () => {
      const password1 = "TestPass123";
      const password2 = "DifferentPass456";
      const hash1 = await passwordService.hashPassword(password1);
      const hash2 = await passwordService.hashPassword(password2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe("comparePassword", () => {
    it("should return true for matching password and hash", async () => {
      const plainPassword = "TestPass123";
      const hash = await passwordService.hashPassword(plainPassword);
      const result = await passwordService.comparePassword(plainPassword, hash);

      expect(result).toBe(true);
    });

    it("should return false for non-matching password", async () => {
      const plainPassword = "TestPass123";
      const wrongPassword = "WrongPass456";
      const hash = await passwordService.hashPassword(plainPassword);
      const result = await passwordService.comparePassword(wrongPassword, hash);

      expect(result).toBe(false);
    });

    it("should return false for similar but not exact password", async () => {
      const plainPassword = "TestPass123";
      const similarPassword = "TestPass124"; // Off by one digit
      const hash = await passwordService.hashPassword(plainPassword);
      const result = await passwordService.comparePassword(similarPassword, hash);

      expect(result).toBe(false);
    });

    it("should be case-sensitive", async () => {
      const plainPassword = "TestPass123";
      const differentCase = "testpass123";
      const hash = await passwordService.hashPassword(plainPassword);
      const result = await passwordService.comparePassword(differentCase, hash);

      expect(result).toBe(false);
    });

    it("should handle empty string comparison", async () => {
      const plainPassword = "TestPass123";
      const hash = await passwordService.hashPassword(plainPassword);
      const result = await passwordService.comparePassword("", hash);

      expect(result).toBe(false);
    });
  });

  describe("integration: validate, hash, and compare", () => {
    it("should complete full password lifecycle", async () => {
      const plainPassword = "SecurePass123";

      // 1. Validate
      expect(() => passwordService.validatePassword(plainPassword)).not.toThrow();

      // 2. Hash
      const hash = await passwordService.hashPassword(plainPassword);
      expect(hash).toBeDefined();

      // 3. Compare
      const isMatch = await passwordService.comparePassword(plainPassword, hash);
      expect(isMatch).toBe(true);
    });

    it("should reject weak password before hashing", async () => {
      const weakPassword = "weak";

      expect(() => passwordService.validatePassword(weakPassword)).toThrow();
    });
  });
});
