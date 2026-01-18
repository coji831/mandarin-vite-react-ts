/**
 * AuthRepository
 * Prisma-backed repository for authentication data operations
 * Implements IAuthRepository interface
 */

import { prisma } from "../../models/index.js";

export class AuthRepository {
  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<object|null>}
   */
  async findUserByEmail(email) {
    return await prisma.user.findUnique({ where: { email } });
  }

  /**
   * Find user by ID
   * @param {string} userId - User ID
   * @returns {Promise<object|null>}
   */
  async findUserById(userId) {
    return await prisma.user.findUnique({ where: { id: userId } });
  }

  /**
   * Create new user
   * @param {object} data - User data {email, passwordHash, displayName}
   * @returns {Promise<object>}
   */
  async createUser(data) {
    return await prisma.user.create({ data });
  }

  /**
   * Create session with refresh token
   * @param {object} data - Session data {userId, refreshToken, expiresAt}
   * @returns {Promise<object>}
   */
  async createSession(data) {
    return await prisma.session.create({ data });
  }

  /**
   * Find session by refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<object|null>} Session with user relation
   */
  async findSessionByToken(refreshToken) {
    return await prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true },
    });
  }

  /**
   * Delete session by ID
   * @param {string} sessionId - Session ID
   * @returns {Promise<void>}
   */
  async deleteSession(sessionId) {
    try {
      await prisma.session.delete({ where: { id: sessionId } });
    } catch (error) {
      // Ignore P2025 (record not found) - already deleted
      if (error.code !== "P2025") {
        throw error;
      }
    }
  }

  /**
   * Delete all sessions by refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<void>}
   */
  async deleteSessionsByToken(refreshToken) {
    await prisma.session.deleteMany({ where: { refreshToken } });
  }
}
