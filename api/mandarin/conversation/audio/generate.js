// api/mandarin/conversation/audio/generate.js
// Vercel serverless function for conversation audio generation
// Refactored to match local-backend service layer patterns

import { Storage } from "@google-cloud/storage";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import crypto from "crypto";

// Client instances
let storageClient = null;
let ttsClient = null;
let bucketName = null;

/**
 * Initialize Google Cloud clients
 * Uses TTS credentials for both TTS and GCS operations
 */
function initializeClients() {
  if (storageClient && ttsClient) return;

  try {
    const credentialsJson = process.env.GOOGLE_TTS_CREDENTIALS_RAW;
    if (!credentialsJson) {
      console.log("[ConversationAudio] GOOGLE_TTS_CREDENTIALS_RAW not set");
      return;
    }

    const credentials = JSON.parse(credentialsJson);
    bucketName = process.env.GCS_BUCKET_NAME;

    if (!bucketName) {
      console.log("[ConversationAudio] GCS_BUCKET_NAME not set");
      return;
    }

    storageClient = new Storage({
      credentials,
      projectId: credentials.project_id,
    });

    ttsClient = new TextToSpeechClient({
      credentials,
      projectId: credentials.project_id,
    });

    console.log(`[ConversationAudio] Clients initialized: ${bucketName}`);
  } catch (error) {
    console.error("[ConversationAudio] Client init failed:", error.message);
  }
}

/**
 * Compute conversation text hash (SHA256)
 */
function computeConversationTextHash(wordId) {
  return crypto.createHash("sha256").update(wordId).digest("hex");
}

/**
 * Compute conversation audio hash from turns
 */
function computeConversationAudioHash(turns) {
  const text = turns.map((t) => t.text).join("\n");
  return crypto.createHash("sha256").update(text).digest("hex");
}

/**
 * Check if file exists in GCS
 */
async function fileExists(filePath) {
  if (!storageClient || !bucketName) return false;
  const file = storageClient.bucket(bucketName).file(filePath);
  const [exists] = await file.exists();
  return exists;
}

/**
 * Download file from GCS
 */
async function downloadFile(filePath) {
  const file = storageClient.bucket(bucketName).file(filePath);
  const [contents] = await file.download();
  return contents;
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
 * Extract Chinese text from conversation turns for TTS
 */
function extractTextFromConversation(conversation) {
  if (!conversation?.turns || !Array.isArray(conversation.turns)) {
    return null;
  }

  const chineseTexts = conversation.turns.map((turn) => {
    let text = turn.text;
    text = text.split("(")[0].split(" -")[0].trim();
    text = text.replace(/[？。，！]*$/, "");
    return text;
  });

  const combinedText = chineseTexts.join("。");
  console.log(`[ConversationAudio] Extracted text: ${combinedText}`);
  return combinedText;
}

/**
 * Synthesize speech using Google Cloud TTS
 */
async function synthesizeSpeech(text, voice = "cmn-CN-Wavenet-B") {
  if (!ttsClient) {
    throw new Error("TTS client not initialized");
  }

  console.log(`[ConversationAudio] Generating TTS for: "${text}"`);

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
  console.log("[ConversationAudio] TTS generated successfully");
  return response.audioContent;
}

/**
 * Main Vercel handler
 */
export default async function handler(req, res) {
  console.log(`[ConversationAudio] ${req.method} request received`);

  // Initialize clients
  initializeClients();

  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { wordId, turnIndex, text, voice = "cmn-CN-Wavenet-B" } = req.body || {};

    if (!wordId || typeof turnIndex !== "number" || !text) {
      return res.status(400).json({ error: "wordId, turnIndex, and text are required" });
    }

    const hash = computeConversationTextHash(wordId);
    const conversationId = `${wordId}-${hash}`;
    const conversationPath = `convo/${wordId}/${hash}.json`;
    const conversationExists = await fileExists(conversationPath);
    if (!conversationExists) {
      return res.status(404).json({
        error: `Conversation not found for wordId: ${wordId}. Generate text first.`,
      });
    }

    const buffer = await downloadFile(conversationPath);
    const conversation = JSON.parse(buffer.toString());
    if (!conversation.turns || !conversation.turns[turnIndex]) {
      return res.status(400).json({ error: `Turn ${turnIndex} not found in conversation` });
    }

    // If audioUrl already exists, return it
    if (conversation.turns[turnIndex].audioUrl && conversation.turns[turnIndex].audioUrl.trim()) {
      return res.json({
        conversationId,
        turnIndex,
        audioUrl: conversation.turns[turnIndex].audioUrl,
        voice,
        cached: true,
        generatedAt: new Date().toISOString(),
      });
    }

    // Generate audio for this turn only
    const turnAudioHash = crypto.createHash("sha256").update(text).digest("hex");
    const turnAudioPath = `convo/${wordId}/${hash}-turn${turnIndex + 1}-${turnAudioHash}.mp3`;
    let audioUrl = "";
    if (await fileExists(turnAudioPath)) {
      audioUrl = getPublicUrl(turnAudioPath);
    } else {
      const audioBuffer = await synthesizeSpeech(text, voice);
      await uploadFile(turnAudioPath, audioBuffer, "audio/mpeg");
      audioUrl = getPublicUrl(turnAudioPath);
    }

    // Update conversation JSON with new audioUrl for this turn
    conversation.turns[turnIndex].audioUrl = audioUrl;
    await uploadFile(
      conversationPath,
      Buffer.from(JSON.stringify(conversation)),
      "application/json"
    );

    return res.json({
      conversationId,
      turnIndex,
      audioUrl,
      voice,
      cached: false,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[ConversationAudio] Error:", error);
    return res.status(500).json({
      error: "Failed to generate audio",
      message: error.message,
    });
  }
}
