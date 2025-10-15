// api/mandarin/conversation/audio/generate.js - Vercel Serverless Function for Conversation Audio Generation
// This file was moved from api/conversation/audio/generate.js to better organize mandarin features.

import { Storage } from "@google-cloud/storage";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import { computeHash } from "../../../../local-backend/utils/hashUtils.js";

// Storage client and TTS client will be initialized per request
let storage = null;
let BUCKET_NAME = null;
let ttsClient = null;

// Initialize storage and TTS clients
function initializeClients() {
  if (storage && ttsClient) return; // Already initialized

  try {
    const gcsCredentialsJson = process.env.GEMINI_API_CREDENTIALS_RAW;
    if (!gcsCredentialsJson) {
      console.log("[AudioGenerate] GEMINI_API_CREDENTIALS_RAW not set, skipping initialization");
      return;
    }

    const gcsCredentials = JSON.parse(gcsCredentialsJson);
    BUCKET_NAME = process.env.GCS_BUCKET_NAME;

    if (!BUCKET_NAME) {
      console.log("[AudioGenerate] GCS_BUCKET_NAME not set, skipping initialization");
      return;
    }

    // Initialize Storage client
    storage = new Storage({
      credentials: gcsCredentials,
      projectId: gcsCredentials.project_id,
    });

    // Initialize TTS client with the same credentials
    ttsClient = new TextToSpeechClient({
      credentials: gcsCredentials,
      projectId: gcsCredentials.project_id,
    });

    console.log(`[AudioGenerate] Clients initialized with bucket: ${BUCKET_NAME}`);
  } catch (error) {
    console.error("[AudioGenerate] Failed to initialize clients:", error.message);
  }
}

async function checkAudioCache(wordId, hash) {
  if (!storage || !BUCKET_NAME) {
    console.log("[AudioGenerate] Storage not initialized, skipping cache lookup");
    return { exists: false };
  }

  try {
    const audioFilePath = `convo/${wordId}/${hash}.mp3`;
    const audioFile = storage.bucket(BUCKET_NAME).file(audioFilePath);
    const [exists] = await audioFile.exists();

    if (exists) {
      console.log(`[AudioGenerate] Cache hit for audio: ${audioFilePath}`);
      return {
        exists: true,
        audioUrl: `https://storage.googleapis.com/${BUCKET_NAME}/${audioFilePath}`,
      };
    }

    console.log(`[AudioGenerate] Cache miss for audio: ${audioFilePath}`);
    return { exists: false };
  } catch (error) {
    console.log(`[AudioGenerate] Cache check failed: ${error.message}`);
    return { exists: false };
  }
}

async function checkTextCache(wordId, hash) {
  if (!storage || !BUCKET_NAME) {
    return null;
  }

  const filePath = `convo/${wordId}/${hash}.json`;
  const file = storage.bucket(BUCKET_NAME).file(filePath);

  try {
    const [exists] = await file.exists();
    if (!exists) return null;

    const [contents] = await file.download();
    return JSON.parse(contents.toString());
  } catch (err) {
    console.error("[AudioGenerate] Text cache lookup error:", err.message);
    return null;
  }
}

async function cacheConversationAudio(wordId, hash, audioBuffer) {
  if (!storage || !BUCKET_NAME) {
    console.log("[AudioGenerate] Storage not initialized, skipping audio cache");
    return null;
  }

  try {
    const audioFilePath = `convo/${wordId}/${hash}.mp3`;
    const audioFile = storage.bucket(BUCKET_NAME).file(audioFilePath);

    await audioFile.save(audioBuffer, {
      metadata: { contentType: "audio/mpeg" },
      public: true,
    });

    const audioUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${audioFilePath}`;
    console.log(`[AudioGenerate] Successfully stored audio: ${audioFilePath}`);
    return audioUrl;
  } catch (error) {
    console.error(`[AudioGenerate] Failed to store audio: ${error.message}`);
    throw error;
  }
}

function extractTextFromConversation(conversation) {
  if (!conversation || !conversation.turns || !Array.isArray(conversation.turns)) {
    return null;
  }

  const chineseTexts = conversation.turns.map((turn) => {
    let text = turn.text;
    text = text.split("(")[0].split(" -")[0].trim();
    text = text.replace(/[？。，！]*$/, "");
    return text;
  });

  const combinedText = chineseTexts.join("。");
  console.log(`[AudioGenerate] Extracted Chinese text from conversation: ${combinedText}`);
  return combinedText;
}

async function generateTTSAudio(text, voice = "cmn-CN-Standard-A") {
  if (!ttsClient) {
    throw new Error("TTS client not initialized");
  }

  console.log(`[AudioGenerate] Generating TTS for text: "${text}"`);

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
  console.log(`[AudioGenerate] TTS generated successfully`);

  return response.audioContent;
}

// Main Vercel handler
export default async function handler(req, res) {
  console.log(`[AudioGenerate] ${req.method} request received`);

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
    const { wordId, voice = "cmn-CN-Standard-A", bitrate = 128, format = "url" } = req.body || {};

    if (!wordId) {
      return res.status(400).json({ error: "wordId is required in request body" });
    }

    console.log(`[AudioGenerate] Generating audio for wordId: ${wordId}`);

    const hash = computeHash(wordId);

    // Check if audio already exists
    const cached = await checkAudioCache(wordId, hash);
    if (cached && cached.exists) {
      return res.json({
        conversationId: `${wordId}-${hash}`,
        audioUrl: cached.audioUrl,
        voice,
        bitrate,
        isCached: true,
        generatedAt: new Date().toISOString(),
      });
    }

    // Extract text for TTS from cached conversation
    let conversation = await checkTextCache(wordId, hash);
    console.log(`[AudioGenerate] Retrieved conversation for TTS`);

    let textForTTS = extractTextFromConversation(conversation);
    if (typeof textForTTS !== "string" || !textForTTS.trim()) {
      textForTTS = "你好，今天天气真好。是的，我们去公园走走吧。好主意，我们现在就走。";
    }
    console.log(`[AudioGenerate] Text for TTS: ${textForTTS}`);

    // Generate audio using TTS client directly
    const audioContent = await generateTTSAudio(textForTTS, voice);

    // Store in GCS under conversation cache path
    const storedUrl = await cacheConversationAudio(wordId, hash, audioContent);

    return res.json({
      conversationId: `${wordId}-${hash}`,
      audioUrl: storedUrl,
      voice,
      bitrate,
      isCached: false,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[AudioGenerate] Error:", error);
    return res.status(500).json({
      error: "Failed to generate audio",
      message: error.message,
    });
  }
}
