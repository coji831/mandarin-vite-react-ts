/**
 * Conversation Service
 * Core business logic for conversation text and audio generation.
 * Orchestrates cache, Gemini API, TTS, and GCS operations.
 * Clean architecture: depends on infrastructure layer via dependency injection.
 */

import { config } from "../../config/index.js";
import { createLogger } from "../../utils/logger.js";
import * as geminiClient from "../../infrastructure/external/GeminiClient.js";
import * as ttsClient from "../../infrastructure/external/GoogleTTSClient.js";
import * as gcsClient from "../../infrastructure/external/GCSClient.js";
import { extractTextFromConversation } from "../../utils/conversationUtils.js";
import {
  computeConversationTextHash,
  computeConversationAudioHash,
} from "../../utils/hashUtils.js";
import { createConversationPrompt } from "../../utils/promptUtils.js";

const logger = createLogger("ConversationService");

// ============================================================================
// TEXT GENERATION
// ============================================================================

/**
 * Parse conversation text from Gemini API response
 * Extracts speaker turns in "A: ... B: ..." format
 * @param {string} rawText - Raw text from Gemini API
 * @returns {Array<{speaker: string, text: string}>} Parsed conversation turns
 * @private
 */
function parseConversationText(rawText) {
  const lines = rawText.split("\n").filter((line) => line.trim());
  const turns = [];

  for (const line of lines) {
    const trimmed = line.trim();
    let speaker = null;
    let chinese = "";
    let pinyin = "";
    let english = "";
    // Expect format: A: <Chinese> | <Pinyin> | <English>
    const match = trimmed.match(/^(A|B):\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(.*)$/);
    if (match) {
      speaker = match[1];
      chinese = match[2];
      pinyin = match[3];
      english = match[4];
    } else if (trimmed.startsWith("A:")) {
      speaker = "A";
      chinese = trimmed.substring(2).trim();
    } else if (trimmed.startsWith("B:")) {
      speaker = "B";
      chinese = trimmed.substring(2).trim();
    }
    if (speaker) {
      turns.push({
        speaker,
        chinese,
        pinyin,
        english,
        audioUrl: "", // To be filled after audio synthesis
      });
    }
  }

  // Ensure we have 3-5 turns
  if (turns.length < 3) {
    logger.warn("Not enough turns generated, using fallback");
    return [
      { speaker: "A", chinese: "你好，今天天气真好。", pinyin: "", english: "", audioUrl: "" },
      { speaker: "B", chinese: "是的，我们去公园走走吧。", pinyin: "", english: "", audioUrl: "" },
      { speaker: "A", chinese: "好主意，我们现在就走。", pinyin: "", english: "", audioUrl: "" },
    ];
  }

  return turns.slice(0, 5); // Limit to 5 turns max
}

/**
 * Generate conversation text (with caching)
 * @param {string} wordId - Vocabulary word ID
 * @param {string} word - The word itself
 * @param {string} generatorVersion - Version identifier (default: v1)
 * @returns {Promise<Object>} Conversation object with turns
 */
export async function generateConversationText(wordId, word, generatorVersion = "v1") {
  const hash = computeConversationTextHash(wordId);
  const cachePath = config.cachePaths.conversationText
    .replace("{wordId}", wordId)
    .replace("{hash}", hash);

  // Check cache first
  const exists = await gcsClient.fileExists(cachePath);
  if (exists) {
    logger.info(`Cache hit: ${cachePath}`);
    const buffer = await gcsClient.downloadFile(cachePath);
    return JSON.parse(buffer.toString());
  }

  // Cache miss - generate new conversation
  logger.info(`Cache miss: ${cachePath}`);
  logger.info(`Generating conversation for word: ${word} (${wordId})`);

  // Build prompt: request Chinese, pinyin, and English for each turn
  const prompt = createConversationPrompt(word, {
    requireRichTurn: true,
  });

  // Generate text via Gemini API
  const rawText = await geminiClient.generateText(prompt, {
    model: config.gemini.model,
    temperature: config.gemini.temperature,
    maxTokens: config.gemini.maxTokens,
  });

  // Parse into structured format (now includes chinese, pinyin, english, audioUrl)
  const turns = parseConversationText(rawText);

  // Build conversation object
  const conversation = {
    id: `${wordId}-${hash}`,
    wordId,
    word,
    generatorVersion,
    prompt,
    turns,
    generatedAt: new Date().toISOString(),
  };

  logger.info(`Generated ${turns.length} turns for conversation ${conversation.id}`);

  // Save to cache
  const buffer = Buffer.from(JSON.stringify(conversation));
  await gcsClient.uploadFile(cachePath, buffer, "application/json");
  logger.info(`Successfully cached: ${cachePath}`);

  return conversation;
}

// ============================================================================
// AUDIO GENERATION
// ============================================================================

/**
 * Generate conversation audio (with caching)
 *
 * @param {string} wordId - Word identifier for conversation lookup
 * @param {string} voice - TTS voice name
 * @returns {Promise<Object>} Audio metadata { conversationId, audioUrl, voice, cached }
 */

// On-demand per-turn audio generation
export async function generateTurnAudio(wordId, turnIndex, text, voice = config.tts.voiceDefault) {
  const hash = computeConversationTextHash(wordId);
  const conversationId = `${wordId}-${hash}`;
  const conversationPath = config.cachePaths.conversationText
    .replace("{wordId}", wordId)
    .replace("{hash}", hash);

  const conversationExists = await gcsClient.fileExists(conversationPath);
  if (!conversationExists) {
    throw new Error(`Conversation not found for wordId: ${wordId}. Generate text first.`);
  }

  const buffer = await gcsClient.downloadFile(conversationPath);
  const conversation = JSON.parse(buffer.toString());
  if (!conversation.turns || !conversation.turns[turnIndex]) {
    throw new Error(`Turn ${turnIndex} not found in conversation`);
  }

  // If audioUrl already exists, return it
  if (conversation.turns[turnIndex].audioUrl && conversation.turns[turnIndex].audioUrl.trim()) {
    return {
      conversationId,
      turnIndex,
      audioUrl: conversation.turns[turnIndex].audioUrl,
      voice,
      cached: true,
      generatedAt: new Date().toISOString(),
    };
  }

  // Generate audio for this turn only
  const crypto = await import("crypto");
  const turnAudioHash = crypto.createHash("sha256").update(text).digest("hex");
  const turnAudioPath = config.cachePaths.conversationAudio
    .replace("{wordId}", wordId)
    .replace("{hash}", `${hash}-turn${turnIndex + 1}-${turnAudioHash}`);
  let audioUrl = "";
  if (await gcsClient.fileExists(turnAudioPath)) {
    audioUrl = gcsClient.getPublicUrl(turnAudioPath);
  } else {
    const audioBuffer = await ttsClient.synthesizeSpeech(text, { voice });
    await gcsClient.uploadFile(turnAudioPath, audioBuffer, "audio/mpeg");
    audioUrl = gcsClient.getPublicUrl(turnAudioPath);
  }

  // Update conversation JSON with new audioUrl for this turn
  conversation.turns[turnIndex].audioUrl = audioUrl;
  await gcsClient.uploadFile(
    conversationPath,
    Buffer.from(JSON.stringify(conversation)),
    "application/json",
  );

  return {
    conversationId,
    turnIndex,
    audioUrl,
    voice,
    cached: false,
    generatedAt: new Date().toISOString(),
  };
}
