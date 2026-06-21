/**
 * @file apps/backend/src/modules/quiz/strategies/index.js
 * Quiz strategy registry.
 * Add new strategies here as they are created.
 */
import { audioToTypeStrategy } from "./AudioToTypeStrategy.js";

const REGISTRY = {
  "audio-to-type": audioToTypeStrategy,
};

/**
 * Get a registered strategy by type name.
 * @param {string} type - The quiz type identifier
 * @returns {object|null} The strategy object, or null if not found
 */
export function getStrategy(type) {
  return REGISTRY[type] ?? null;
}

/**
 * Get all registered strategy types.
 * @returns {string[]}
 */
export function getRegisteredTypes() {
  return Object.keys(REGISTRY);
}
