/**
 * Prisma Database Client
 * Centralized database client for infrastructure layer
 *
 * Usage: Import this client in repository implementations
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { config } from "../../config/index.js";

// Create PostgreSQL connection pool
const pool = new pg.Pool({ connectionString: config.databaseUrl });

// Create Prisma adapter
const adapter = new PrismaPg(pool);

// Initialize Prisma client with adapter
const prisma = new PrismaClient({
  adapter,
  log: ["error", "warn"],
});

export { prisma };
export default prisma;
