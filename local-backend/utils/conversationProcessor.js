// Processing utilities for conversation
import {
  cacheConversationAudio,
  cacheConversationText,
  checkAudioCache,
  checkTextCache,
} from "./conversationCache.js";
import { extractTextFromConversation } from "./conversationUtils.js";
import { computeHash } from "./hashUtils.js";
import { createConversationPrompt } from "./promptUtils.js";
import { generateConversationText } from "./conversationGenerator.js";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";

// TTS client will be initialized on first use
let ttsClient = null;

function initializeTTSClient() {
  if (ttsClient) return ttsClient;

  const ttsCredentialsJson = process.env.GOOGLE_TTS_CREDENTIALS_RAW;
  if (!ttsCredentialsJson) {
    throw new Error("GOOGLE_TTS_CREDENTIALS_RAW environment variable is not set");
  }

  const ttsCredentials = JSON.parse(ttsCredentialsJson);
  ttsClient = new TextToSpeechClient({
    credentials: ttsCredentials,
    projectId: ttsCredentials.project_id,
  });

  console.log("[ConversationProcessor] TTS client initialized");
  return ttsClient;
}

/**
 * Handle conversation generation workflow (cache check + generation)
 * @param {string} wordId - Word identifier
 * @param {string} word - Word text
 * @returns {Promise<Object>} Generated or cached conversation
 */
export async function handleGetRealText(wordId, word) {
  const conversationPrompt = createConversationPrompt(word);
  const hash = computeHash(wordId);
  // Try cache lookup first
  let conversation = await checkTextCache(wordId, hash);
  if (conversation) {
    // Cache hit: return cached conversation, skip Gemini call
    console.log(`[ConversationProcessor] Cache hit for conversation ${wordId}`);
    return conversation;
  }
  // Cache miss: call Gemini and cache result
  console.log(`[ConversationProcessor] Cache miss, generating new conversation for ${wordId}`);
  conversation = await generateConversationText(wordId, conversationPrompt, "v1");
  conversation.generatedAt = new Date().toISOString();
  conversation.id = `${wordId}-${hash}`;
  conversation.word = word || wordId;

  await cacheConversationText(wordId, hash, conversation);
  return conversation;
}

/**
 * Handle audio generation workflow for a word (cache check -> generate -> store)
 * @param {string} wordId
 * @param {{voice?:string, bitrate?:number, format?:string}} [options]
 * @returns {Promise<Object>} Audio metadata including audioUrl
 */
export async function handleGetRealAudio(options = {}) {
  const { wordId, voice = "cmn-CN-Standard-A", bitrate = 128, format = "url" } = options;

  console.log(`[ConversationProcessor] Real mode: getting audio for ${wordId}`);

  const hash = computeHash(wordId);

  // Check if audio already exists
  const cached = await checkAudioCache(wordId, hash);
  if (cached && cached.exists) {
    return {
      conversationId: `${wordId}-${hash}`,
      audioUrl: cached.audioUrl,
      voice,
      bitrate,
      isCached: true,
      generatedAt: new Date().toISOString(),
    };
  }

  // Extract text for TTS from cached conversation, or use fallback
  let conversation = await checkTextCache(wordId, hash);
  console.log(`[AudioProcessor] Retrieved conversation for TTS: ${JSON.stringify(conversation)}`);
  let textForTTS = extractTextFromConversation(conversation);
  if (typeof textForTTS !== "string" || !textForTTS.trim()) {
    textForTTS = "你好，今天天气真好。是的，我们去公园走走吧。好主意，我们现在就走。";
  }
  console.log(`[AudioProcessor] Converted conversation for TTS: ${textForTTS}`);

  try {
    // Initialize TTS client
    const client = initializeTTSClient();

    // Generate audio directly using TTS client
    const request = {
      input: { text: textForTTS },
      voice: {
        languageCode: "cmn-CN",
        name: voice,
      },
      audioConfig: {
        audioEncoding: "MP3",
      },
    };

    console.log("[AudioProcessor] Calling Google Cloud TTS API...");
    const [response] = await client.synthesizeSpeech(request);
    const audioContent = response.audioContent;

    // Store audio in GCS
    const storedUrl = await cacheConversationAudio(wordId, hash, audioContent);

    return {
      conversationId: `${wordId}-${hash}`,
      audioUrl: storedUrl,
      voice,
      bitrate,
      isCached: false,
      generatedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error("[ConversationProcessor] handleGetRealAudio error:", err.message || err);
    return {
      conversationId: `${wordId}-${hash}`,
      audioUrl: null,
      voice,
      bitrate,
      isCached: false,
      error: err.message || String(err),
    };
  }
}
