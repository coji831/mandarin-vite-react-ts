import crypto from "crypto";

export function computeHash(input = "") {
  return crypto.createHash("sha256").update(`${input}`).digest("hex");
}

export function computeTTSHash(text, voice = "") {
  return crypto.createHash("md5").update(`${text}${voice}`).digest("hex");
}

export function computeConversationTextHash(wordId, generatorVersion = "v1") {
  // NOTE: Currently only hashing wordId to maintain backward compatibility
  return computeHash(wordId);
}

export function computeConversationAudioHash(turns) {
  const text = turns.map((t) => t.text).join("\n");
  return computeHash(text);
}
