/**
 * Prisma Database Client
 * Centralized database client for infrastructure layer
 *
 * Usage: Import this client in repository implementations
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export { prisma };
export default prisma;
