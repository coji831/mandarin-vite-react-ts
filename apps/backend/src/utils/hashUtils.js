import crypto from "crypto";

/**
 * Generic hash function - base implementation
 * @param {string} input - String to hash
 * @returns {string} SHA256 hex digest
 */
export function computeHash(input = "") {
  return crypto.createHash("sha256").update(`${input}`).digest("hex");
}

/**
 * Generate consistent cache key for conversation text
 * Maintains same hash output as before (wordId only)
 * @param {string} wordId - Word identifier
 * @param {string} generatorVersion - Generator version (currently unused to maintain backward compatibility)
 * @returns {string} SHA256 hash
 */
export function computeConversationTextHash(wordId, generatorVersion = "v1") {
  // NOTE: Currently only hashing wordId to maintain backward compatibility
  // In future, may include generatorVersion: `${wordId}-${generatorVersion}`
  return computeHash(wordId);
}

/**
 * Generate consistent cache key for conversation audio
 * @param {Array<{text: string}>} turns - Conversation turns
 * @returns {string} SHA256 hash
 */
export function computeConversationAudioHash(turns) {
  const text = turns.map((t) => t.text).join("\n");
  return computeHash(text);
}

/**
 * Generate consistent cache key for TTS
 * @param {string} text - Text to synthesize
 * @param {string} voice - Voice name (optional, for future use)
 * @returns {string} SHA256 hash (currently MD5 for backward compatibility)
 */
export function computeTTSHash(text, voice = "") {
  // Use MD5 for TTS to maintain backward compatibility with existing cache
  return crypto.createHash("md5").update(`${text}${voice}`).digest("hex");
}

/**
 * Short, human-friendly hash used for stable identifiers
 * @param {string} str - String to hash
 * @returns {string} 6-character hash
 */
export function shortHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36).slice(0, 6);
}
