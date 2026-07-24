/**
 * @file apps/backend/scripts/client.ts
 * @description Shared Prisma client for all database scripts.
 * Reuses the app's PrismaPg adapter pattern so scripts don't duplicate DB setup.
 *
 * Import: import { prisma } from "../scripts/client.js";
 */
import { prisma } from "../src/shared/infrastructure/database/client.js";
export { prisma };
