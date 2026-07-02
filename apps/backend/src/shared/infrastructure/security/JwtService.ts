/**
 * JwtService
 * Infrastructure layer service for JWT token operations
 * Handles token generation and verification
 */

import jwt from "jsonwebtoken";
import { config } from "../../config/index.js";

export class JwtService {
  public readonly JWT_SECRET: string;
  public readonly JWT_REFRESH_SECRET: string;
  public readonly ACCESS_TOKEN_EXPIRY: string;
  public readonly REFRESH_TOKEN_EXPIRY: string;

  constructor() {
    this.JWT_SECRET = config.jwtSecret as string;
    this.JWT_REFRESH_SECRET = config.jwtRefreshSecret as string;
    this.ACCESS_TOKEN_EXPIRY = "15m";
    this.REFRESH_TOKEN_EXPIRY = "7d";

    if (!this.JWT_SECRET || !this.JWT_REFRESH_SECRET) {
      throw new Error("JWT_SECRET and JWT_REFRESH_SECRET must be set in environment variables");
    }
  }

  /**
   * Generate JWT access token
   * @param userId - User ID
   * @returns Access token
   */
  generateAccessToken(userId: string): string {
    return jwt.sign({ userId }, this.JWT_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY as any,
    });
  }

  /**
   * Generate JWT refresh token with uniqueness guarantees
   * @param userId - User ID
   * @returns Refresh token
   */
  generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId, timestamp: Date.now(), random: Math.random() },
      this.JWT_REFRESH_SECRET,
      { expiresIn: this.REFRESH_TOKEN_EXPIRY as any },
    );
  }

  /**
   * Verify and decode refresh token
   * @param token - Refresh token
   * @returns Decoded payload
   * @throws If token is invalid or expired
   */
  verifyRefreshToken(token: string): Record<string, unknown> {
    return jwt.verify(token, this.JWT_REFRESH_SECRET) as Record<string, unknown>;
  }

  /**
   * Calculate refresh token expiration date
   * @returns Expiration date (7 days from now)
   */
  getRefreshTokenExpiration(): Date {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
}
