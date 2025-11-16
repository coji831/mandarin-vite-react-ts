// api/mandarin/conversation/text/generate.js
// Vercel serverless function for conversation text generation
// Refactored to match local-backend service layer patterns

import { Storage } from "@google-cloud/storage";
import crypto from "crypto";

// Client instances
let storageClient = null;
let bucketName = null;

/**
 * Initialize Google Cloud Storage client
 */
function initializeStorage() {
  if (storageClient) return;

  try {
    const credentialsJson = process.env.GEMINI_API_CREDENTIALS_RAW;
    if (!credentialsJson) {
      console.log("[ConversationText] GEMINI_API_CREDENTIALS_RAW not set");
      return;
    }

    const credentials = JSON.parse(credentialsJson);
    bucketName = process.env.GCS_BUCKET_NAME;

    if (!bucketName) {
      console.log("[ConversationText] GCS_BUCKET_NAME not set");
      return;
    }

    storageClient = new Storage({
      credentials,
      projectId: credentials.project_id,
    });

    console.log(`[ConversationText] Storage initialized: ${bucketName}`);
  } catch (error) {
    console.error("[ConversationText] Storage init failed:", error.message);
  }
}

/**
 * Compute conversation text hash (SHA256)
 */
function computeConversationTextHash(wordId) {
  return crypto.createHash("sha256").update(wordId).digest("hex");
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
 * Create conversation prompt
 */
function createConversationPrompt(word) {
  return `Generate a short Mandarin conversation using ${word}. Please respond with a simple conversation in this format:
A: [first speaker line]
B: [second speaker line]
A: [third speaker line]
B: [fourth speaker line]

Keep it conversational and natural, with exactly 4 lines total. Only use Mandarin Chinese characters—do not include pinyin, English, or any translations.`;
}

/**
 * Parse conversation text from Gemini response
 */
function parseConversationText(rawText) {
  const lines = rawText.split("\n").filter((line) => line.trim());
  const turns = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("A:")) {
      turns.push({ speaker: "A", text: trimmed.substring(2).trim() });
    } else if (trimmed.startsWith("B:")) {
      turns.push({ speaker: "B", text: trimmed.substring(2).trim() });
    }
  }

  // Fallback if not enough turns
  if (turns.length < 3) {
    console.log("[ConversationText] Not enough turns, using fallback");
    return [
      { speaker: "A", text: "你好，今天天气真好。" },
      { speaker: "B", text: "是的，我们去公园走走吧。" },
      { speaker: "A", text: "好主意，我们现在就走。" },
    ];
  }

  return turns.slice(0, 5);
}

/**
 * Generate text via Gemini API
 */
async function generateText(prompt) {
  const credentialsJson = process.env.GEMINI_API_CREDENTIALS_RAW;
  if (!credentialsJson) {
    throw new Error("GEMINI_API_CREDENTIALS_RAW not set");
  }

  const credentials = JSON.parse(credentialsJson);
  const { JWT } = await import("google-auth-library");

  const jwtClient = new JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ["https://www.googleapis.com/auth/generative-language"],
  });

  const model = process.env.GEMINI_MODEL || "models/gemini-2.0-flash-lite";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent`;
  const accessToken = await jwtClient.getAccessToken();

  console.log(`[ConversationText] Calling Gemini API: ${model}`);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[ConversationText] Gemini API error: ${response.status}`);
    throw new Error(`Gemini API failed: ${response.status}`);
  }

  const data = await response.json();
  const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!generatedText) {
    console.error("[ConversationText] No text in response");
    throw new Error("Gemini API response missing text content");
  }

  console.log(`[ConversationText] Generated ${generatedText.length} characters`);
  return generatedText;
}

/**
 * Main Vercel handler
 */
export default async function handler(req, res) {
  console.log(`[ConversationText] ${req.method} request received`);

  // Initialize storage
  initializeStorage();

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
    const { wordId, word, generatorVersion = "v1" } = req.body || {};

    if (!wordId || !word) {
      return res.status(400).json({
        error: "wordId and word are required",
      });
    }

    console.log(`[ConversationText] Generating for: ${word} (${wordId})`);

    const hash = computeConversationTextHash(wordId);
    const cachePath = `convo/${wordId}/${hash}.json`;

    // Check cache first
    const exists = await fileExists(cachePath);
    if (exists) {
      console.log(`[ConversationText] Cache hit: ${cachePath}`);
      const buffer = await downloadFile(cachePath);
      const conversation = JSON.parse(buffer.toString());
      return res.json({
        ...conversation,
        _metadata: {
          mode: "real",
          processedAt: new Date().toISOString(),
          cached: true,
        },
      });
    }

    // Cache miss - generate
    console.log(`[ConversationText] Cache miss: ${cachePath}`);
    const prompt = createConversationPrompt(word);
    const rawText = await generateText(prompt);
    const turns = parseConversationText(rawText);

    const conversation = {
      id: `${wordId}-${hash}`,
      wordId,
      word,
      generatorVersion,
      prompt: `Generate a short Mandarin conversation using ${word}`,
      turns,
      generatedAt: new Date().toISOString(),
    };

    console.log(`[ConversationText] Generated ${turns.length} turns`);

    // Save to cache
    const buffer = Buffer.from(JSON.stringify(conversation));
    await uploadFile(cachePath, buffer, "application/json");
    console.log(`[ConversationText] Successfully cached: ${cachePath}`);

    return res.json({
      ...conversation,
      _metadata: {
        mode: "real",
        processedAt: new Date().toISOString(),
        cached: false,
      },
    });
  } catch (error) {
    console.error("[ConversationText] Error:", error);
    return res.status(500).json({
      error: "Failed to generate conversation",
      message: error.message,
    });
  }
}
