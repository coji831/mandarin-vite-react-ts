/**
 * JwtService
 * Infrastructure layer service for JWT token operations
 * Handles token generation and verification
 */

import jwt from "jsonwebtoken";
import { config } from "../../config/index.js";

/** Payload shape with userId guaranteed by our token generation. */
export interface TokenPayload {
  userId: string;
  timestamp?: number;
  random?: number;
  iat?: number;
  exp?: number;
}

export class JwtService {
  public readonly JWT_SECRET: string;
  public readonly JWT_REFRESH_SECRET: string;
  public readonly ACCESS_TOKEN_EXPIRY: string;
  public readonly REFRESH_TOKEN_EXPIRY: string;

  constructor() {
    this.JWT_SECRET = config.jwtSecret!;
    this.JWT_REFRESH_SECRET = config.jwtRefreshSecret!;
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
      expiresIn: this.ACCESS_TOKEN_EXPIRY as jwt.SignOptions["expiresIn"],
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
      { expiresIn: this.REFRESH_TOKEN_EXPIRY as jwt.SignOptions["expiresIn"] },
    );
  }

  /**
   * Verify and decode refresh token
   * @param token - Refresh token
   * @returns Decoded payload
   * @throws If token is invalid or expired
   */
  verifyRefreshToken(token: string): TokenPayload {
    return jwt.verify(token, this.JWT_REFRESH_SECRET) as TokenPayload;
  }

  /**
   * Verify and decode an access token
   * @param token - Access token
   * @returns Decoded payload
   * @throws `TokenExpiredError` if the token is expired, `JsonWebTokenError`
   * if it is invalid (mismatched signature / malformed) — the same error
   * contract `authMiddleware.ts` relies on.
   *
   * Story 24-5: lets the Nest auth guards consume `JwtService` (via the
   * `SharedModule` provider) instead of importing `jsonwebtoken` directly,
   * centralizing access-token verification. Additive — the Express path
   * (`authMiddleware.ts`) still calls `jwt.verify` directly and is untouched.
   */
  verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, this.JWT_SECRET) as TokenPayload;
  }

  /**
   * Calculate refresh token expiration date
   * @returns Expiration date (7 days from now)
   */
  getRefreshTokenExpiration(): Date {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
}
