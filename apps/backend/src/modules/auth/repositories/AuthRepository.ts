/**
 * AuthRepository
 * Prisma-backed repository for authentication data operations
 * Implements IAuthRepository interface
 */

import { prisma } from "../../../shared/infrastructure/database/client.js";
import type { User, Session, Prisma } from "@prisma/client";

export class AuthRepository {
  /**
   * Find user by email
   */
  async findUserByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({ where: { email } });
  }

  /**
   * Find user by ID
   */
  async findUserById(userId: string): Promise<User | null> {
    return await prisma.user.findUnique({ where: { id: userId } });
  }

  /**
   * Create new user
   */
  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    return await prisma.user.create({ data });
  }

  /**
   * Create session with refresh token
   */
  async createSession(data: Prisma.SessionCreateInput): Promise<Session> {
    return await prisma.session.create({ data });
  }

  /**
   * Find session by refresh token
   */
  async findSessionByToken(refreshToken: string): Promise<(Session & { user: User }) | null> {
    return await prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true },
    });
  }

  /**
   * Delete session by ID
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      await prisma.session.delete({ where: { id: sessionId } });
    } catch (error: any) {
      // Ignore P2025 (record not found) - already deleted
      if (error.code !== "P2025") {
        throw error;
      }
    }
  }

  /**
   * Delete all sessions by refresh token
   */
  async deleteSessionsByToken(refreshToken: string): Promise<void> {
    await prisma.session.deleteMany({ where: { refreshToken } });
  }
}
