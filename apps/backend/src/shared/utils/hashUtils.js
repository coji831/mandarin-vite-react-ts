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
  if (!Array.isArray(turns)) {
    return computeHash("");
  }
  const concatenated = turns.map((t) => t.text || "").join("|");
  return computeHash(concatenated);
}

/**
 * Generate consistent cache key for TTS audio
 * @param {string} text - Text to synthesize
 * @param {string} voice - TTS voice name
 * @returns {string} SHA256 hash
 */
export function computeTTSHash(text, voice) {
  return computeHash(`${text}-${voice}`);
}

export default {
  computeHash,
  computeConversationTextHash,
  computeConversationAudioHash,
  computeTTSHash,
};
