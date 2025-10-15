// api/conversation/text/generate.js - Vercel Serverless Function for Conversation Text Generation
// Based on local-backend/utils/conversationProcessor.js and conversationGenerator.js

import { Storage } from "@google-cloud/storage";
import { computeHash } from "../../../local-backend/utils/hashUtils.js";

// Storage client will be initialized per request
let storage = null;
let BUCKET_NAME = null;

// Initialize storage client
function initializeStorage() {
  if (storage) return; // Already initialized

  try {
    const gcsCredentialsJson = process.env.GEMINI_API_CREDENTIALS_RAW;
    if (!gcsCredentialsJson) {
      console.log("[TextGenerate] GEMINI_API_CREDENTIALS_RAW not set, skipping GCS initialization");
      return;
    }

    const gcsCredentials = JSON.parse(gcsCredentialsJson);
    BUCKET_NAME = process.env.GCS_BUCKET_NAME;

    if (!BUCKET_NAME) {
      console.log("[TextGenerate] GCS_BUCKET_NAME not set, skipping GCS initialization");
      return;
    }

    storage = new Storage({
      credentials: gcsCredentials,
      projectId: gcsCredentials.project_id,
    });

    console.log(`[TextGenerate] GCS initialized with bucket: ${BUCKET_NAME}`);
  } catch (error) {
    console.error("[TextGenerate] Failed to initialize GCS:", error.message);
  }
}

async function checkTextCache(wordId, hash) {
  if (!storage || !BUCKET_NAME) {
    console.log("[TextGenerate] Storage not initialized, skipping cache lookup");
    return null;
  }

  const filePath = `convo/${wordId}/${hash}.json`;
  const file = storage.bucket(BUCKET_NAME).file(filePath);

  try {
    const [exists] = await file.exists();
    if (!exists) {
      console.log(`[TextGenerate] Cache miss for ${wordId}/${hash}`);
      return null;
    }

    const [contents] = await file.download();
    console.log(`[TextGenerate] Cache hit for ${wordId}/${hash}`);
    return JSON.parse(contents.toString());
  } catch (err) {
    console.error("[TextGenerate] GCS cache lookup error:", err.message);
    return null;
  }
}

async function cacheConversationText(wordId, hash, convo) {
  if (!storage || !BUCKET_NAME) {
    console.log("[TextGenerate] Storage not initialized, skipping cache store");
    return false;
  }

  const filePath = `convo/${wordId}/${hash}.json`;
  const file = storage.bucket(BUCKET_NAME).file(filePath);

  try {
    await file.save(JSON.stringify(convo), { contentType: "application/json" });
    console.log(`[TextGenerate] Successfully stored conversation in cache: ${wordId}/${hash}`);
    return true;
  } catch (err) {
    console.error("[TextGenerate] GCS cache store error:", err.message);
    if (err.code === 403) {
      console.error("[TextGenerate] Permission denied - check Storage Object Creator role");
    }
    return false;
  }
}

async function generateConversationText(wordId, prompt, generatorVersion) {
  const geminiCredentialsRaw = process.env.GEMINI_API_CREDENTIALS_RAW;
  if (!geminiCredentialsRaw) throw new Error("Missing GEMINI_API_CREDENTIALS_RAW env var");

  const geminiCredentials = JSON.parse(geminiCredentialsRaw);
  const { JWT } = await import("google-auth-library");

  const client = new JWT({
    email: geminiCredentials.client_email,
    key: geminiCredentials.private_key,
    scopes: ["https://www.googleapis.com/auth/generative-language"],
  });

  const modelName = "models/gemini-2.0-flash-lite";
  const accessToken = await client.getAccessToken();

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${prompt}. Please respond with a simple conversation in this format:
                      A: [first speaker line]
                      B: [second speaker line]
                      A: [third speaker line]
                      B: [fourth speaker line]
                    Keep it conversational and natural, with exactly 4 lines total. Only use Mandarin Chinese characters—do not include pinyin, English, or any translations.`,
              },
            ],
          },
        ],
      }),
    }
  );

  const data = await response.json();

  let turns = [];

  if (data.error) {
    console.log("[TextGenerate] Gemini API error detected:", data.error);
    console.log("[TextGenerate] Using fallback conversation due to API error");
  }

  if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
    const generatedText = data.candidates[0].content.parts[0].text;
    console.log("[TextGenerate] Generated text:", generatedText);

    const lines = generatedText.split("\n").filter((line) => line.trim());

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("A:")) {
        turns.push({ speaker: "A", text: trimmed.substring(2).trim() });
      } else if (trimmed.startsWith("B:")) {
        turns.push({ speaker: "B", text: trimmed.substring(2).trim() });
      }
    }

    if (turns.length < 3) {
      console.log("[TextGenerate] Not enough turns generated, using fallback");
      turns = [];
    } else {
      turns = turns.slice(0, 5);
      console.log(`[TextGenerate] Successfully parsed ${turns.length} conversation turns`);
    }
  }

  if (turns.length === 0) {
    console.log("[TextGenerate] No valid candidates in response, using fallback");
    turns = [
      { speaker: "A", text: `你好，你能用'${wordId}'造个句子吗？` },
      { speaker: "B", text: `当然可以！'${wordId}'是一个很有用的词。` },
      { speaker: "A", text: `太好了，你能再给一个例子吗？` },
      { speaker: "B", text: `没问题，这是另一个用${wordId}的例子。` },
    ];
  }

  return {
    id: "",
    generatedAt: "",
    wordId,
    generatorVersion,
    prompt,
    turns,
  };
}

function createConversationPrompt(word) {
  return `Generate a short Mandarin conversation using ${word}`;
}

// Main Vercel handler
export default async function handler(req, res) {
  console.log(`[TextGenerate] ${req.method} request received`);

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
    const { wordId, word } = req.body || {};

    if (!wordId) {
      return res.status(400).json({ error: "wordId is required in request body" });
    }

    console.log(`[TextGenerate] Generating conversation for wordId: ${wordId}, word: ${word}`);

    const conversationPrompt = createConversationPrompt(word || wordId);
    const hash = computeHash(wordId);

    // Try cache lookup first
    let conversation = await checkTextCache(wordId, hash);

    if (conversation) {
      // Cache hit: return cached conversation
      console.log(`[TextGenerate] Cache hit for conversation ${wordId}`);
      return res.json({
        ...conversation,
        _metadata: {
          mode: "real",
          processedAt: new Date().toISOString(),
          cached: true,
        },
      });
    }

    // Cache miss: call Gemini and cache result
    console.log(`[TextGenerate] Cache miss, generating new conversation for ${wordId}`);
    conversation = await generateConversationText(wordId, conversationPrompt, "v1");
    conversation.generatedAt = new Date().toISOString();
    conversation.id = `${wordId}-${hash}`;
    conversation.word = word || wordId;

    // Cache the result
    await cacheConversationText(wordId, hash, conversation);

    return res.json({
      ...conversation,
      _metadata: {
        mode: "real",
        processedAt: new Date().toISOString(),
        cached: false,
      },
    });
  } catch (error) {
    console.error("[TextGenerate] Error:", error);
    return res.status(500).json({
      error: "Failed to generate conversation",
      message: error.message,
    });
  }
}
