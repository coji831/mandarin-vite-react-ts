/**
 * @file apps/backend/src/core/services/AuthService.js
 * @description Core authentication service with business logic
 *
 * Clean architecture implementation:
 * - Depends on IAuthRepository (data access)
 * - Depends on JwtService (token operations)
 * - Depends on PasswordService (password hashing/validation)
 * - No direct Prisma or bcrypt imports
 * - Pure business logic for registration, login, token management
 */

export class AuthService {
  /**
   * @param {object} authRepository - Implementation of IAuthRepository
   * @param {object} jwtService - JWT token service
   * @param {object} passwordService - Password hashing service
   */
  constructor(authRepository, jwtService, passwordService) {
    this.repository = authRepository;
    this.jwtService = jwtService;
    this.passwordService = passwordService;
  }

  /**
   * Register a new user
   * @param {string} email - User email
   * @param {string} password - Plain text password
   * @param {string} [displayName] - Optional display name
   * @returns {Promise<{user: object, tokens: {accessToken: string, refreshToken: string}}>}
   */
  async register(email, password, displayName) {
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
   * @param {string} email - User email
   * @param {string} password - Plain text password
   * @returns {Promise<{user: object, tokens: {accessToken: string, refreshToken: string}}>}
   */
  async login(email, password) {
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
   * @param {string} refreshToken - Current refresh token
   * @returns {Promise<{accessToken: string, refreshToken: string}>}
   */
  async refresh(refreshToken) {
    try {
      const payload = this.jwtService.verifyRefreshToken(refreshToken);

      // Verify refresh token exists in database
      const session = await this.repository.findSessionByToken(refreshToken);

      if (!session || session.expiresAt < new Date()) {
        throw new Error("Invalid refresh token");
      }

      // Generate new tokens
      const tokens = await this.generateTokens(payload.userId);

      // Delete old session (token rotation)
      await this.repository.deleteSession(session.id);

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
    await this.repository.deleteSessionsByToken(refreshToken);
  }

  /**
   * Generate JWT access and refresh tokens
   * @private
   * @param {string} userId - User ID
   * @returns {Promise<{accessToken: string, refreshToken: string}>}
   */
  async generateTokens(userId) {
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
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise<object|null>}
   */
  async getUserById(userId) {
    const user = await this.repository.findUserById(userId);
    return user ? this.sanitizeUser(user) : null;
  }

  /**
   * Remove sensitive fields from user object (business logic)
   * @private
   * @param {object} user - User object from database
   * @returns {object} Sanitized user object
   */
  sanitizeUser(user) {
    const { passwordHash, deletedAt, ...sanitized } = user;
    return sanitized;
  }
}
