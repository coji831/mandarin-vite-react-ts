// Deterministic ID and hash generator utilities
import crypto from "crypto";

export function generateConversationId(
  wordId: string,
  generatorVersion: string,
  promptHash: string
): string {
  return `${wordId}-${generatorVersion}-${promptHash.substring(0, 8)}`;
}

export function generatePromptHash(prompt: string, word: string): string {
  return crypto.createHash("sha256").update(`${prompt}:${word}`).digest("hex");
}
