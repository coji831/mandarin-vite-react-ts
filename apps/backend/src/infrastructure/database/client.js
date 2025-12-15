/**
 * @file apps/backend/src/infrastructure/database/client.js
 * @description Prisma Client singleton for database access
 *
 * This module provides a singleton instance of Prisma Client with proper
 * connection pooling and logging configuration for development and production.
 *
 * @see https://www.prisma.io/docs/guides/performance-and-optimization/connection-management
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "pg";
const { Pool } = pkg;

const globalForPrisma = global;

function createPrismaClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Gracefully disconnect from database on process termination
 */
export async function disconnectDatabase() {
  await prisma.$disconnect();
}
