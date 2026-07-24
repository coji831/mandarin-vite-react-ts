/**
 * @file apps/backend/scripts/logger.ts
 * @description Shared logger for all scripts.
 * Wraps the app's logger with a "script:" prefix for consistent formatting.
 *
 * Import: import { scriptLogger } from "../scripts/logger.js";
 */
import { createLogger } from "../src/shared/utils/logger.js";

export type ScriptLogger = ReturnType<typeof createLogger>;

export function scriptLogger(name: string): ScriptLogger {
  return createLogger(`script:${name}`);
}
