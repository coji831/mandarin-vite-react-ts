import crypto from "crypto";

/**
 * Deterministic SHA256 hash used for conversation cache keys.
 * Current implementation hashes the provided wordId only.
 * Keep signature stable so callers remain compatible.
 * @param {string} [wordId] - Word identifier used to derive the cache key
 * @returns {string} hex digest
 */
export function computeHash(wordId = "") {
  // Deterministic hash for cache key - use only wordId
  // Keep the signature and parameter order so existing call sites remain valid.
  return crypto.createHash("sha256").update(`${wordId}`).digest("hex");
}

/**
 * Short, human-friendly hash used for scaffold fixture ids.
 * Mirrors the previous shortHash implementation.
 * @param {string} str
 * @returns {string}
 */
export function shortHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36).slice(0, 6);
}
