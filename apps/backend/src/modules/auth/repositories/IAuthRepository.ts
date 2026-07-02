/**
 * IAuthRepository Interface
 * Defines the contract for authentication data access operations
 *
 * @interface IAuthRepository
 */

import type { User, Session, Prisma } from "@prisma/client";

export interface IAuthRepository {
  findUserByEmail(email: string): Promise<User | null>;
  findUserById(userId: string): Promise<User | null>;
  createUser(data: Prisma.UserCreateInput): Promise<User>;
  createSession(data: Prisma.SessionCreateInput): Promise<Session>;
  findSessionByToken(refreshToken: string): Promise<(Session & { user: User }) | null>;
  deleteSession(sessionId: string): Promise<void>;
  deleteSessionsByToken(refreshToken: string): Promise<void>;
}
