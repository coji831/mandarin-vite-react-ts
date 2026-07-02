import crypto from "crypto";

/**
 * A conversation turn with a text field.
 */
interface Turn {
  text?: string;
  [key: string]: unknown;
}

/**
 * Generic hash function - base implementation
 * @param input - String to hash
 * @returns SHA256 hex digest
 */
export function computeHash(input: string = ""): string {
  return crypto.createHash("sha256").update(`${input}`).digest("hex");
}

/**
 * Generate consistent cache key for conversation text
 * Maintains same hash output as before (wordId only)
 * @param wordId - Word identifier
 * @param generatorVersion - Generator version (currently unused to maintain backward compatibility)
 * @returns SHA256 hash
 */
export function computeConversationTextHash(
  wordId: string,
  generatorVersion: string = "v1",
): string {
  // NOTE: Currently only hashing wordId to maintain backward compatibility
  // In future, may include generatorVersion: `${wordId}-${generatorVersion}`
  return computeHash(wordId);
}

/**
 * Generate consistent cache key for conversation audio
 * @param turns - Conversation turns
 * @returns SHA256 hash
 */
export function computeConversationAudioHash(turns: Turn[]): string {
  if (!Array.isArray(turns)) {
    return computeHash("");
  }
  const concatenated = turns.map((t: Turn) => t.text || "").join("|");
  return computeHash(concatenated);
}

/**
 * Generate consistent cache key for TTS audio
 * @param text - Text to synthesize
 * @param voice - TTS voice name
 * @returns SHA256 hash
 */
export function computeTTSHash(text: string, voice: string): string {
  return computeHash(`${text}-${voice}`);
}

export default {
  computeHash,
  computeConversationTextHash,
  computeConversationAudioHash,
  computeTTSHash,
};
