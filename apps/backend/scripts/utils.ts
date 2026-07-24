/**
 * @file apps/backend/scripts/utils.ts
 * @description Shared utilities for scripts: env loading, atomic file writes, etc.
 *
 * Import: import { loadEnv, writeJsonAtomic, ensureDir } from "../scripts/utils.js";
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Load .env.local from the monorepo root (2 levels up from apps/backend/). */
export function loadEnv(): void {
  const envPath = path.resolve(__dirname, "../../../.env.local");
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  } else {
    console.warn("⚠️  .env.local not found at", envPath);
  }
}

/** Write a JSON file atomically (temp file → rename). */
export function writeJsonAtomic(filePath: string, data: unknown): void {
  const tmpPath = filePath + ".tmp";
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tmpPath, filePath);
}

/** Ensure a directory exists (create if missing). */
export function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
