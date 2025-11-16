/**
 * Conversation Service
 * High-level service for conversation text and audio generation.
 * Orchestrates cache, Gemini API, TTS, and GCS operations.
 */

import { config } from "../config/index.js";
import { createLogger } from "../utils/logger.js";
import * as geminiService from "./geminiService.js";
import * as ttsService from "./ttsService.js";
import * as gcsService from "./gcsService.js";
import { extractTextFromConversation } from "../utils/conversationUtils.js";
import { computeConversationTextHash, computeConversationAudioHash } from "../utils/hashUtils.js";
import { createConversationPrompt } from "../utils/promptUtils.js";

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
    if (trimmed.startsWith("A:")) {
      turns.push({ speaker: "A", text: trimmed.substring(2).trim() });
    } else if (trimmed.startsWith("B:")) {
      turns.push({ speaker: "B", text: trimmed.substring(2).trim() });
    }
  }

  // Ensure we have 3-5 turns
  if (turns.length < 3) {
    logger.warn("Not enough turns generated, using fallback");
    return [
      { speaker: "A", text: "你好，今天天气真好。" },
      { speaker: "B", text: "是的，我们去公园走走吧。" },
      { speaker: "A", text: "好主意，我们现在就走。" },
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
  const exists = await gcsService.fileExists(cachePath);
  if (exists) {
    logger.info(`Cache hit: ${cachePath}`);
    const buffer = await gcsService.downloadFile(cachePath);
    return JSON.parse(buffer.toString());
  }

  // Cache miss - generate new conversation
  logger.info(`Cache miss: ${cachePath}`);
  logger.info(`Generating conversation for word: ${word} (${wordId})`);

  // Build prompt
  const prompt = createConversationPrompt(word);

  // Generate text via Gemini API
  const rawText = await geminiService.generateText(prompt, {
    model: config.gemini.model,
    temperature: config.gemini.temperature,
    maxTokens: config.gemini.maxTokens,
  });

  // Parse into structured format
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
  await gcsService.uploadFile(cachePath, buffer, "application/json");
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
export async function generateConversationAudio(wordId, voice = config.tts.voiceDefault) {
  const hash = computeConversationTextHash(wordId);
  const conversationId = `${wordId}-${hash}`;

  // First, retrieve the conversation text to get turns
  const conversationPath = config.cachePaths.conversationText
    .replace("{wordId}", wordId)
    .replace("{hash}", hash);

  const conversationExists = await gcsService.fileExists(conversationPath);
  if (!conversationExists) {
    throw new Error(`Conversation not found for wordId: ${wordId}. Generate text first.`);
  }

  const buffer = await gcsService.downloadFile(conversationPath);
  const conversation = JSON.parse(buffer.toString());

  // Build audio cache path
  const audioHash = computeConversationAudioHash(conversation.turns);
  const audioPath = config.cachePaths.conversationAudio
    .replace("{wordId}", wordId)
    .replace("{hash}", audioHash);

  // Check audio cache
  const audioExists = await gcsService.fileExists(audioPath);
  if (audioExists) {
    logger.info(`Cache hit: ${audioPath}`);
    const audioUrl = gcsService.getPublicUrl(audioPath);
    return {
      conversationId,
      audioUrl,
      voice,
      cached: true,
      generatedAt: new Date().toISOString(),
    };
  }

  // Cache miss - generate audio
  logger.info(`Cache miss: ${audioPath}`);
  logger.info(`Generating audio for ${conversation.turns.length} turns`);

  // Extract text for TTS
  const textForTTS = extractTextFromConversation(conversation);
  if (!textForTTS?.trim()) {
    logger.warn("No valid text extracted, using fallback");
    const fallbackText = "你好，今天天气真好。是的，我们去公园走走吧。好主意，我们现在就走。";
    const audioBuffer = await ttsService.synthesizeSpeech(fallbackText, { voice });
    await gcsService.uploadFile(audioPath, audioBuffer, "audio/mpeg");
  } else {
    const audioBuffer = await ttsService.synthesizeSpeech(textForTTS, { voice });
    await gcsService.uploadFile(audioPath, audioBuffer, "audio/mpeg");
  }

  logger.info(`Successfully cached: ${audioPath}`);

  const audioUrl = gcsService.getPublicUrl(audioPath);
  return {
    conversationId,
    audioUrl,
    voice,
    cached: false,
    generatedAt: new Date().toISOString(),
  };
}
