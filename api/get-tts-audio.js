// api/get-tts-audio.js
// Vercel serverless function for TTS audio generation with GCS caching
// Refactored to match local-backend service layer patterns

import { Storage } from "@google-cloud/storage";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import crypto from "crypto";

// Client instances (initialized once per cold start)
let ttsClient = null;
let storageClient = null;
let bucketName = null;

/**
 * Initialize Google Cloud clients
 * Uses TTS credentials for both TTS and GCS operations
 */
function initializeClients() {
  if (ttsClient && storageClient) return;

  try {
    const credentialsJson = process.env.GOOGLE_TTS_CREDENTIALS_RAW;
    if (!credentialsJson) {
      throw new Error("GOOGLE_TTS_CREDENTIALS_RAW environment variable not set");
    }

    const credentials = JSON.parse(credentialsJson);

    ttsClient = new TextToSpeechClient({
      credentials,
      projectId: credentials.project_id,
    });

    bucketName = process.env.GCS_BUCKET_NAME;
    if (!bucketName) {
      throw new Error("GCS_BUCKET_NAME environment variable not set");
    }

    storageClient = new Storage({
      credentials,
      projectId: credentials.project_id,
    });

    console.log(`[TTS] Clients initialized. Bucket: ${bucketName}`);
  } catch (error) {
    console.error("[TTS] Initialization failed:", error.message);
    throw error;
  }
}

/**
 * Compute TTS cache hash (MD5 for backward compatibility)
 */
function computeTTSHash(text, voice = "") {
  return crypto.createHash("md5").update(`${text}${voice}`).digest("hex");
}

/**
 * Check if file exists in GCS
 */
async function fileExists(filePath) {
  const file = storageClient.bucket(bucketName).file(filePath);
  const [exists] = await file.exists();
  return exists;
}

/**
 * Upload file to GCS
 */
async function uploadFile(filePath, buffer, contentType) {
  const file = storageClient.bucket(bucketName).file(filePath);
  await file.save(buffer, { contentType });
}

/**
 * Get public URL for GCS file
 */
function getPublicUrl(filePath) {
  return `https://storage.googleapis.com/${bucketName}/${filePath}`;
}

/**
 * Synthesize speech using Google Cloud TTS
 */
async function synthesizeSpeech(text, voice = "cmn-CN-Wavenet-B") {
  const request = {
    input: { text },
    voice: {
      languageCode: "cmn-CN",
      name: voice,
    },
    audioConfig: {
      audioEncoding: "MP3",
    },
  };

  const [response] = await ttsClient.synthesizeSpeech(request);
  return response.audioContent;
}

/**
 * Main Vercel handler
 */
export default async function handler(req, res) {
  console.log(`[TTS] ${req.method} request received`);

  // Initialize clients
  try {
    initializeClients();
  } catch (error) {
    return res.status(500).json({
      error: "Server initialization error",
      message: error.message,
    });
  }

  // Method check
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text, voice = "cmn-CN-Wavenet-B" } = req.body || {};

  // Validation
  if (!text || text.trim() === "") {
    return res.status(400).json({ error: "Text is required" });
  }

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0 || words.length > 15) {
    return res.status(400).json({
      error: "Please enter between 1 and 15 words",
      wordCount: words.length,
    });
  }

  try {
    // Compute cache path
    const hash = computeTTSHash(text, voice);
    const cachePath = `tts/${hash}.mp3`;

    // Check cache first
    const exists = await fileExists(cachePath);
    if (exists) {
      console.log(`[TTS] Cache hit: ${cachePath}`);
      const audioUrl = getPublicUrl(cachePath);
      return res.status(200).json({ audioUrl, cached: true });
    }

    // Cache miss - generate audio
    console.log(`[TTS] Cache miss: ${cachePath}`);
    console.log(`[TTS] Generating audio for: "${text}"`);

    const audioBuffer = await synthesizeSpeech(text, voice);

    // Upload to GCS
    await uploadFile(cachePath, audioBuffer, "audio/mpeg");
    console.log(`[TTS] Successfully cached: ${cachePath}`);

    const audioUrl = getPublicUrl(cachePath);
    return res.status(200).json({ audioUrl, cached: false });
  } catch (error) {
    console.error("[TTS] Error:", error);

    // Specific error handling
    if (error.code === 7 || error.details?.includes("API key not valid")) {
      return res.status(500).json({
        error: "Authentication error with TTS/GCS API",
        message: "Check GOOGLE_TTS_CREDENTIALS_RAW",
      });
    } else if (error.code === 3 && error.details?.includes("Billing")) {
      return res.status(500).json({
        error: "Google Cloud Billing not enabled",
      });
    } else if (error.code === 403) {
      return res.status(500).json({
        error: "GCS permission denied",
        message: "Ensure service account has Storage Object Creator/Viewer roles",
      });
    }

    return res.status(500).json({
      error: "Error generating or caching audio",
      message: error.message,
    });
  }
}
