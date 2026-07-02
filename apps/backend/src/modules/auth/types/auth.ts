/**
 * @file apps/backend/src/modules/auth/types/auth.ts
 * @description Type definitions for the Auth module
 */

/**
 * Token pair returned by login, register, and refresh operations.
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Register / login result containing the sanitized user and tokens.
 */
export interface AuthResult {
  user: SanitizedUser;
  tokens: TokenPair;
}

/**
 * Sanitized user shape — excludes sensitive fields.
 */
export interface SanitizedUser {
  id: string;
  email: string;
  displayName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * JWT service interface consumed by AuthService.
 */
import type { TokenPayload } from "../../../shared/infrastructure/security/JwtService.js";

export interface IJwtService {
  generateAccessToken(userId: string): string;
  generateRefreshToken(userId: string): string;
  verifyRefreshToken(token: string): TokenPayload;
  getRefreshTokenExpiration(): Date;
}

/**
 * Password service interface consumed by AuthService.
 */
export interface IPasswordService {
  hashPassword(password: string): Promise<string>;
  comparePassword(plain: string, hash: string): Promise<boolean>;
  validatePassword(password: string): void;
}
