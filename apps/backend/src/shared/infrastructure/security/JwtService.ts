/**
 * JwtService
 * Infrastructure layer service for JWT token operations
 * Handles token generation and verification
 */

import jwt, { JsonWebTokenError } from "jsonwebtoken";
import { config } from "../../config/index.js";

/** Payload shape with userId guaranteed by our token generation. */
export interface TokenPayload {
  userId: string;
  /** Deployment env the token is bound to (Story 24-17 env isolation). */
  env?: string;
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
   * Deployment environment a token is bound to. PR-preview environments set
   * `APP_ENV=pr-<n>`; production leaves it unset (default "production"). Read
   * at call-time (not import-time) so tests can vary it per-case.
   */
  private expectedEnv(): string {
    return process.env.APP_ENV ?? "production";
  }

  /**
   * Reject a token minted for a different — or missing — deployment env
   * (Story 24-17 env-isolation hardening). PR-preview tokens (`env: "pr-<n>"`)
   * must never be accepted by production or another PR env, even when the
   * signing secret matches (secrets are per-env via CI; the env claim is
   * defense-in-depth). Throws the same `JsonWebTokenError`-shaped error the
   * guards already classify, so guard/parity behavior is unchanged.
   */
  private assertEnvClaim(payload: TokenPayload): void {
    if (payload.env !== this.expectedEnv()) {
      throw new JsonWebTokenError(
        `Token env claim does not match APP_ENV (got ${String(payload.env)}, expected ${this.expectedEnv()})`,
      );
    }
  }

  /**
   * Generate JWT access token
   * @param userId - User ID
   * @returns Access token
   */
  generateAccessToken(userId: string): string {
    return jwt.sign({ userId, env: this.expectedEnv() }, this.JWT_SECRET, {
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
      { userId, env: this.expectedEnv(), timestamp: Date.now(), random: Math.random() },
      this.JWT_REFRESH_SECRET,
      { expiresIn: this.REFRESH_TOKEN_EXPIRY as jwt.SignOptions["expiresIn"] },
    );
  }

  /**
   * Verify and decode refresh token
   * @param token - Refresh token
   * @returns Decoded payload
   * @throws If token is invalid, expired, or minted for a different env
   */
  verifyRefreshToken(token: string): TokenPayload {
    const payload = jwt.verify(token, this.JWT_REFRESH_SECRET) as TokenPayload;
    this.assertEnvClaim(payload);
    return payload;
  }

  /**
   * Verify and decode an access token
   * @param token - Access token
   * @returns Decoded payload
   * @throws `TokenExpiredError` if the token is expired, `JsonWebTokenError`
   * if it is invalid (mismatched signature / malformed).
   *
   * Story 24-5: lets the Nest auth guards consume `JwtService` (via the
   * `SharedModule` provider) instead of importing `jsonwebtoken` directly,
   * centralizing access-token verification. Story 24-17: adds the env-claim
   * check (rejects tokens minted for a different/missing deployment env).
   */
  verifyAccessToken(token: string): TokenPayload {
    const payload = jwt.verify(token, this.JWT_SECRET) as TokenPayload;
    this.assertEnvClaim(payload);
    return payload;
  }

  /**
   * Calculate refresh token expiration date
   * @returns Expiration date (7 days from now)
   */
  getRefreshTokenExpiration(): Date {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
}
