// Utility functions for generator cache and conversation
import crypto from "crypto";
import { Storage } from "@google-cloud/storage";

function computePromptHash(prompt, generatorVersion) {
  // Deterministic hash for cache key
  return crypto.createHash("sha256").update(`${generatorVersion}:${prompt}`).digest("hex");
}

const storage = new Storage();
const BUCKET_NAME = process.env.GCS_BUCKET || "mandarin-conversations";

async function getConversationFromCache(wordId, generatorVersion, promptHash) {
  const filePath = `convo/${wordId}/${generatorVersion}/${promptHash}.json`;
  const file = storage.bucket(BUCKET_NAME).file(filePath);
  try {
    const [exists] = await file.exists();
    if (!exists) return null;
    const [contents] = await file.download();
    return JSON.parse(contents.toString());
  } catch (err) {
    console.error("GCS cache lookup error:", err);
    return null;
  }
}

async function storeConversationInCache(wordId, generatorVersion, promptHash, convo) {
  const filePath = `convo/${wordId}/${generatorVersion}/${promptHash}.json`;
  const file = storage.bucket(BUCKET_NAME).file(filePath);
  try {
    await file.save(JSON.stringify(convo), { contentType: "application/json" });
    return true;
  } catch (err) {
    console.error("GCS cache store error:", err);
    return false;
  }
}

async function generateConversation(wordId, prompt, generatorVersion) {
  // TODO: Integrate with AI service
  // Simulate 3-5 turn conversation
  return {
    id: "",
    generatedAt: "",
    wordId,
    generatorVersion,
    prompt,
    turns: [
      { speaker: "A", text: `Hi, can you use '${prompt}' in a sentence?` },
      { speaker: "B", text: `Sure! '${prompt}' means ...` },
      { speaker: "A", text: `Great, can you give another example?` },
      { speaker: "B", text: `Of course, here's another: ...` },
    ],
  };
}

export {
  computePromptHash,
  getConversationFromCache,
  storeConversationInCache,
  generateConversation,
};
