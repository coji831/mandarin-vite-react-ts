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
  const exists = await gcsService.fileExists(cachePath);
  if (exists) {
    logger.info(`Cache hit: ${cachePath}`);
    const buffer = await gcsService.downloadFile(cachePath);
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
  const rawText = await geminiService.generateText(prompt, {
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

  // Per-turn audio synthesis and upload
  logger.info(`Generating audio for each of ${conversation.turns.length} turns`);
  const updatedTurns = [];
  for (let i = 0; i < conversation.turns.length; i++) {
    const turn = conversation.turns[i];
    const text = turn.chinese || turn.text || "";
    if (!text.trim()) {
      updatedTurns.push({ ...turn, audioUrl: "" });
      continue;
    }
    // Build per-turn audio path
    const turnAudioHash = computeConversationAudioHash([turn]);
    const turnAudioPath = config.cachePaths.conversationAudio
      .replace("{wordId}", wordId)
      .replace("{hash}", `${audioHash}-turn${i + 1}`);
    // Check cache for this turn
    let audioUrl = "";
    if (await gcsService.fileExists(turnAudioPath)) {
      audioUrl = gcsService.getPublicUrl(turnAudioPath);
    } else {
      const audioBuffer = await ttsService.synthesizeSpeech(text, { voice });
      await gcsService.uploadFile(turnAudioPath, audioBuffer, "audio/mpeg");
      audioUrl = gcsService.getPublicUrl(turnAudioPath);
    }
    updatedTurns.push({ ...turn, audioUrl });
  }
  // Optionally, update the conversation object in storage with per-turn audio URLs
  const updatedConversation = { ...conversation, turns: updatedTurns };
  await gcsService.uploadFile(
    conversationPath,
    Buffer.from(JSON.stringify(updatedConversation)),
    "application/json"
  );
  return {
    conversationId,
    turns: updatedTurns,
    voice,
    cached: false,
    generatedAt: new Date().toISOString(),
  };
}
