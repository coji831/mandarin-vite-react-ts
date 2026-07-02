/**
 * Prisma Database Client
 * Centralized database client for infrastructure layer
 *
 * Usage: Import this client in repository implementations
 */

import prismaPkg from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "../../config/index.js";

const { PrismaClient } = prismaPkg;

// Create Prisma adapter — pass connection string directly so Prisma manages its own pool.
// Per Supabase + Prisma docs: https://supabase.com/docs/guides/database/prisma
// Creating a custom pg.Pool conflicts with Prisma's internal connection management.
const adapter = new PrismaPg({ connectionString: config.databaseUrl });

// Initialize Prisma client with adapter
const prisma = new PrismaClient({
  adapter,
  log: ["error", "warn"],
});

export { prisma };
export default prisma;

export type PrismaClientType = typeof prisma;
