/**
 * @file apps/backend/scripts/index.ts
 * @description Barrel file for the scripts shared infrastructure.
 *
 * Import: import { prisma, scriptLogger, loadEnv } from "../scripts/index.js";
 */
export { prisma } from "./client.js";
export { scriptLogger } from "./logger.js";
export { loadEnv, writeJsonAtomic, ensureDir } from "./utils.js";
