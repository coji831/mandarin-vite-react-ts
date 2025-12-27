/**
 * @file apps/backend/src/infrastructure/database/client.js
 * @description Prisma Client singleton for database access
 *
 * This module provides a singleton instance of Prisma Client with proper
 * connection pooling and logging configuration for development and production.
 *
 * Environment variables are loaded by apps/backend/config/index.js (reads root .env.local)
 *
 * @see https://www.prisma.io/docs/guides/performance-and-optimization/connection-management
 */

import { PrismaPg } from "@prisma/adapter-pg";
import pkgPrisma from "@prisma/client";
import pkg from "pg";
const { PrismaClient } = pkgPrisma;
const { Pool } = pkg;

const globalForPrisma = global;

function createPrismaClient() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10, // Maximum pool size
    idleTimeoutMillis: 30000, // Close idle connections after 30s
    connectionTimeoutMillis: 10000, // 10s timeout for new connections
    keepAlive: true, // Enable TCP keep-alive
    keepAliveInitialDelayMillis: 10000, // Start keep-alive after 10s
  });

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
