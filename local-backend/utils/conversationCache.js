// Audio caching utilities for conversation-based audio generation
import { Storage } from "@google-cloud/storage";

// Storage client will be set from the main server
let storage = null;
let BUCKET_NAME = null;

// Cache for selected model to avoid repeated API calls
let cachedModel = null;
let modelCacheExpiry = null;
const MODEL_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Initialize storage client from server
export function initializeStorage(storageClient, bucketName) {
  storage = storageClient;
  BUCKET_NAME = bucketName;
  console.log(`[ConversationGenerator] Initialized with bucket: ${BUCKET_NAME}`);
}

export async function checkTextCache(wordId, hash) {
  if (!storage || !BUCKET_NAME) {
    console.log("[ConversationCache] Storage not initialized, skipping cache lookup");
    return null;
  }

  const filePath = `convo/${wordId}/${hash}.json`;
  const file = storage.bucket(BUCKET_NAME).file(filePath);
  try {
    const [exists] = await file.exists();
    if (!exists) {
      console.log(`[ConversationGenerator] Cache miss for ${wordId}/${hash}`);
      return null;
    }
    const [contents] = await file.download();
    console.log(`[ConversationGenerator] Cache hit for ${wordId}/${hash}`);
    return JSON.parse(contents.toString());
  } catch (err) {
    console.error("[ConversationGenerator] GCS cache lookup error:", err.message);

    // Check if it's a permissions error
    if (
      err.status === 403 ||
      err.message?.includes("permission") ||
      err.message?.includes("forbidden")
    ) {
      console.log("[ConversationGenerator] Permissions issue detected - skipping cache lookup");
    }

    return null;
  }
}

export async function cacheConversationText(wordId, hash, convo) {
  let conversation = JSON.stringify(convo);
  console.log(`[TextCache] Storing conversation text in cache: ${conversation}`);

  if (!storage || !BUCKET_NAME) {
    console.log("[TextCache] Storage not initialized, skipping cache store");
    return false;
  }
  const filePath = `convo/${wordId}/${hash}.json`;
  const file = storage.bucket(BUCKET_NAME).file(filePath);

  try {
    await file.save(conversation, { contentType: "application/json" });

    console.log(`[TextCache] Stored conversation in cache: ${wordId}/${hash}`);
    return true;
  } catch (err) {
    console.error("[TextCache] GCS cache store error:", err.message);

    // Check if it's a permissions error
    if (
      err.status === 403 ||
      err.message?.includes("permission") ||
      err.message?.includes("forbidden")
    ) {
      console.log("[TextCache] Permissions issue detected - continuing without caching");
      console.log("[TextCache] To fix: Grant 'Storage Object Creator' role to the service account");
    }

    return false;
  }
}

/**
 * Check if audio file exists in conversation cache
 * @param {string} wordId - Word identifier
 * @param {string} hash - Content hash
 * @returns {Promise<{exists: boolean, audioUrl?: string}>}
 */
export async function checkAudioCache(wordId, hash) {
  try {
    const audioFilePath = `convo/${wordId}/${hash}.mp3`;

    console.log(`[AudioCache] Checking cache for audio at: ${audioFilePath}`);

    // Prefer the initialized storage client if present
    const storageClient = storage || new Storage();
    const bucketName = BUCKET_NAME || process.env.GCS_BUCKET_NAME;
    const audioFile = storageClient.bucket(bucketName).file(audioFilePath);

    const [exists] = await audioFile.exists();

    if (exists) {
      console.log(`[AudioCache] Cache hit for audio: ${audioFilePath}`);
      return {
        exists: true,
        audioUrl: `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${audioFilePath}`,
      };
    }

    console.log(`[AudioCache] Cache miss for audio: ${audioFilePath}`);
    return { exists: false };
  } catch (error) {
    console.log(`[AudioCache] Cache check failed: ${error.message}`);
    return { exists: false };
  }
}

/**
 * Store audio file in conversation cache structure
 * @param {string} wordId - Word identifier
 * @param {string} hash - Content hash
 * @param {Buffer} audioBuffer - Audio content
 * @returns {Promise<string>} Audio URL
 */
export async function cacheConversationAudio(wordId, hash, audioBuffer) {
  try {
    const audioFilePath = `convo/${wordId}/${hash}.mp3`;

    console.log(`[AudioCache] Storing audio at: ${audioFilePath}`);

    const storageClient = storage || new Storage();
    const bucketName = BUCKET_NAME || process.env.GCS_BUCKET_NAME;
    const audioFile = storageClient.bucket(bucketName).file(audioFilePath);

    await audioFile.save(audioBuffer, {
      metadata: { contentType: "audio/mpeg" },
      public: true,
    });

    const audioUrl = `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${audioFilePath}`;
    console.log(`[AudioCache] Successfully stored audio: ${audioFilePath}`);

    return audioUrl;
  } catch (error) {
    console.error(`[AudioCache] Failed to store audio: ${error.message}`);
    throw error;
  }
}
