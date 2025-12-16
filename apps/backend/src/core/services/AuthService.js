/**
 * @file apps/backend/src/core/services/AuthService.js
 * @description JWT authentication service for user registration, login, token management
 *
 * Handles:
 * - User registration with password validation and hashing
 * - Login with credential verification
 * - JWT access and refresh token generation
 * - Token refresh with rotation (delete old token)
 * - Logout by invalidating refresh tokens
 */

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../../infrastructure/database/client.js";

export class AuthService {
  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET;
    this.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
    this.ACCESS_TOKEN_EXPIRY = "15m";
    this.REFRESH_TOKEN_EXPIRY = "7d";

    if (!this.JWT_SECRET || !this.JWT_REFRESH_SECRET) {
      throw new Error("JWT_SECRET and JWT_REFRESH_SECRET must be set in environment variables");
    }
  }

  /**
   * Register a new user
   * @param {string} email - User email
   * @param {string} password - Plain text password
   * @param {string} [displayName] - Optional display name
   * @returns {Promise<{user: object, tokens: {accessToken: string, refreshToken: string}}>}
   */
  async register(email, password, displayName) {
    // Validate password strength
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
      throw new Error(
        "Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number"
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error("User already exists");
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, passwordHash, displayName },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id);

    return { user: this.sanitizeUser(user), tokens };
  }

  /**
   * Login existing user
   * @param {string} email - User email
   * @param {string} password - Plain text password
   * @returns {Promise<{user: object, tokens: {accessToken: string, refreshToken: string}}>}
   */
  async login(email, password) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.deletedAt) {
      throw new Error("Invalid credentials");
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      throw new Error("Invalid credentials");
    }

    const tokens = await this.generateTokens(user.id);
    return { user: this.sanitizeUser(user), tokens };
  }

  /**
   * Refresh access token using valid refresh token
   * @param {string} refreshToken - Current refresh token
   * @returns {Promise<{accessToken: string, refreshToken: string}>}
   */
  async refresh(refreshToken) {
    try {
      const payload = jwt.verify(refreshToken, this.JWT_REFRESH_SECRET);

      // Verify refresh token exists in database
      const session = await prisma.session.findUnique({
        where: { refreshToken },
        include: { user: true },
      });

      if (!session || session.expiresAt < new Date()) {
        throw new Error("Invalid refresh token");
      }

      // Generate new tokens
      const tokens = await this.generateTokens(payload.userId);

      // Delete old session (token rotation) - handle race condition from React Strict Mode
      try {
        await prisma.session.delete({ where: { id: session.id } });
      } catch (deleteError) {
        // Ignore if already deleted (race condition from double requests)
        console.log("[AuthService] Old session already deleted (race condition)");
      }

      return tokens;
    } catch (error) {
      throw new Error("Invalid refresh token");
    }
  }

  /**
   * Logout user by invalidating refresh token
   * @param {string} refreshToken - Refresh token to invalidate
   * @returns {Promise<void>}
   */
  async logout(refreshToken) {
    await prisma.session.deleteMany({ where: { refreshToken } });
  }

  /**
   * Generate JWT access and refresh tokens
   * @private
   * @param {string} userId - User ID
   * @returns {Promise<{accessToken: string, refreshToken: string}>}
   */
  async generateTokens(userId) {
    const accessToken = jwt.sign({ userId }, this.JWT_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
    });

    // Add timestamp and random value to ensure uniqueness
    const refreshToken = jwt.sign(
      { userId, timestamp: Date.now(), random: Math.random() },
      this.JWT_REFRESH_SECRET,
      { expiresIn: this.REFRESH_TOKEN_EXPIRY }
    );

    // Store refresh token in database
    await prisma.session.create({
      data: {
        userId,
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return { accessToken, refreshToken };
  }

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise<object|null>}
   */
  async getUserById(userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    return user ? this.sanitizeUser(user) : null;
  }

  /**
   * Remove sensitive fields from user object
   * @private
   * @param {object} user - User object from database
   * @returns {object} Sanitized user object
   */
  sanitizeUser(user) {
    const { passwordHash, deletedAt, ...sanitized } = user;
    return sanitized;
  }
}
