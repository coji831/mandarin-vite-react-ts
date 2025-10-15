// Deterministic ID and hash generator utilities
import crypto from "crypto";

export function generateHash(wordId: string): string {
  return crypto.createHash("sha256").update(`${wordId}`).digest("hex");
}
