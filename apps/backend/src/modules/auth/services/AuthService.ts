/**
 * @file apps/backend/src/modules/auth/services/AuthService.ts
 * @description Core authentication service with business logic
 *
 * Clean architecture implementation:
 * - Depends on IAuthRepository (data access)
 * - Depends on JwtService (token operations)
 * - Depends on PasswordService (password hashing/validation)
 * - No direct Prisma or bcrypt imports
 * - Pure business logic for registration, login, token management
 */

import type { User, Session } from "@prisma/client";

/**
 * Token pair returned by login, register, and refresh operations.
 */
interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Register / login result containing the sanitized user and tokens.
 */
interface AuthResult {
  user: SanitizedUser;
  tokens: TokenPair;
}

/**
 * Sanitized user shape — excludes sensitive fields.
 */
interface SanitizedUser {
  id: string;
  email: string;
  displayName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Repository interface consumed by AuthService.
 */
interface IAuthRepository {
  findUserByEmail(email: string): Promise<User | null>;
  findUserById(id: string): Promise<User | null>;
  createUser(data: Record<string, unknown>): Promise<User>;
  findSessionByToken(refreshToken: string): Promise<Session | null>;
  createSession(data: Record<string, unknown>): Promise<Session>;
  deleteSession(id: string): Promise<void>;
  deleteSessionsByToken(refreshToken: string): Promise<void>;
}

/**
 * JWT service interface consumed by AuthService.
 */
interface IJwtService {
  generateAccessToken(userId: string): string;
  generateRefreshToken(userId: string): string;
  verifyRefreshToken(token: string): Record<string, unknown>;
  getRefreshTokenExpiration(): Date;
}

/**
 * Password service interface consumed by AuthService.
 */
interface IPasswordService {
  hashPassword(password: string): Promise<string>;
  comparePassword(plain: string, hash: string): Promise<boolean>;
  validatePassword(password: string): void;
}

export class AuthService {
  private repository: IAuthRepository;
  private jwtService: IJwtService;
  private passwordService: IPasswordService;

  constructor(
    authRepository: IAuthRepository,
    jwtService: IJwtService,
    passwordService: IPasswordService,
  ) {
    this.repository = authRepository;
    this.jwtService = jwtService;
    this.passwordService = passwordService;
  }

  /**
   * Register a new user
   * @param email - User email
   * @param password - Plain text password
   * @param displayName - Optional display name
   */
  async register(email: string, password: string, displayName?: string): Promise<AuthResult> {
    // Validate password strength (business rule)
    this.passwordService.validatePassword(password);

    // Check if user exists (business rule)
    const existingUser = await this.repository.findUserByEmail(email);
    if (existingUser) {
      throw new Error("User already exists");
    }

    // Hash password and create user
    const passwordHash = await this.passwordService.hashPassword(password);
    const user = await this.repository.createUser({ email, passwordHash, displayName });

    // Generate tokens
    const tokens = await this.generateTokens(user.id);

    return { user: this.sanitizeUser(user), tokens };
  }

  /**
   * Login existing user
   * @param email - User email
   * @param password - Plain text password
   */
  async login(email: string, password: string): Promise<AuthResult> {
    const user = await this.repository.findUserByEmail(email);
    if (!user || user.deletedAt) {
      throw new Error("Invalid credentials");
    }

    const validPassword = await this.passwordService.comparePassword(password, user.passwordHash);
    if (!validPassword) {
      throw new Error("Invalid credentials");
    }

    const tokens = await this.generateTokens(user.id);
    return { user: this.sanitizeUser(user), tokens };
  }

  /**
   * Refresh access token using valid refresh token
   * @param refreshToken - Current refresh token
   */
  async refresh(refreshToken: string): Promise<TokenPair> {
    try {
      const payload = this.jwtService.verifyRefreshToken(refreshToken);

      // Verify refresh token exists in database
      const session = await this.repository.findSessionByToken(refreshToken);

      if (!session || session.expiresAt < new Date()) {
        throw new Error("Invalid refresh token");
      }

      // Generate new tokens
      const tokens = await this.generateTokens(payload.userId as string);

      // Delete old session (token rotation)
      await this.repository.deleteSession(session.id);

      return tokens;
    } catch (error) {
      throw new Error("Invalid refresh token");
    }
  }

  /**
   * Logout user by invalidating refresh token
   * @param refreshToken - Refresh token to invalidate
   */
  async logout(refreshToken: string): Promise<void> {
    await this.repository.deleteSessionsByToken(refreshToken);
  }

  /**
   * Generate JWT access and refresh tokens
   * @private
   * @param userId - User ID
   */
  private async generateTokens(userId: string): Promise<TokenPair> {
    const accessToken = this.jwtService.generateAccessToken(userId);
    const refreshToken = this.jwtService.generateRefreshToken(userId);

    // Store refresh token in database
    await this.repository.createSession({
      userId,
      refreshToken,
      expiresAt: this.jwtService.getRefreshTokenExpiration(),
    });

    return { accessToken, refreshToken };
  }

  /**
   * Get user by ID (sanitized, excludes sensitive fields)
   * @param userId - User ID
   */
  async getUserById(userId: string): Promise<SanitizedUser | null> {
    const user = await this.repository.findUserById(userId);
    return user ? this.sanitizeUser(user) : null;
  }

  /**
   * Get raw user by ID (includes all Prisma fields)
   * @param userId - User ID
   */
  async getUser(userId: string): Promise<User | null> {
    return this.repository.findUserById(userId);
  }

  /**
   * Remove sensitive fields from user object (business logic)
   * @private
   * @param user - User object from database
   */
  private sanitizeUser(user: User): SanitizedUser {
    const { passwordHash: _pw, deletedAt: _da, ...sanitized } = user;
    return sanitized;
  }
}
