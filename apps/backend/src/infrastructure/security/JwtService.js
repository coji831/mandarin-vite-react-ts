/**
 * JwtService
 * Infrastructure layer service for JWT token operations
 * Handles token generation and verification
 */

import jwt from "jsonwebtoken";
import config from "../../config/index.js";

export class JwtService {
  constructor() {
    this.JWT_SECRET = config.jwtSecret;
    this.JWT_REFRESH_SECRET = config.jwtRefreshSecret;
    this.ACCESS_TOKEN_EXPIRY = "15m";
    this.REFRESH_TOKEN_EXPIRY = "7d";

    if (!this.JWT_SECRET || !this.JWT_REFRESH_SECRET) {
      throw new Error("JWT_SECRET and JWT_REFRESH_SECRET must be set in environment variables");
    }
  }

  /**
   * Generate JWT access token
   * @param {string} userId - User ID
   * @returns {string} Access token
   */
  generateAccessToken(userId) {
    return jwt.sign({ userId }, this.JWT_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
    });
  }

  /**
   * Generate JWT refresh token with uniqueness guarantees
   * @param {string} userId - User ID
   * @returns {string} Refresh token
   */
  generateRefreshToken(userId) {
    return jwt.sign(
      { userId, timestamp: Date.now(), random: Math.random() },
      this.JWT_REFRESH_SECRET,
      { expiresIn: this.REFRESH_TOKEN_EXPIRY },
    );
  }

  /**
   * Verify and decode refresh token
   * @param {string} token - Refresh token
   * @returns {object} Decoded payload
   * @throws {Error} If token is invalid or expired
   */
  verifyRefreshToken(token) {
    return jwt.verify(token, this.JWT_REFRESH_SECRET);
  }

  /**
   * Calculate refresh token expiration date
   * @returns {Date} Expiration date (7 days from now)
   */
  getRefreshTokenExpiration() {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
}
