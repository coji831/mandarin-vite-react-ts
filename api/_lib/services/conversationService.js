/**
 * @file api/_lib/services/conversationService.js
 * @description High-level conversation generation orchestration with caching.
 *
 * This service generates multi-turn Mandarin conversations using the Gemini API,
 * with intelligent caching in Google Cloud Storage. Each conversation includes
 * Chinese text, pinyin, and English translations for all turns.
 *
 * @exports generateConversationText(wordId, word) - Generate conversation with caching
 *
 * @flow
 * 1. Compute conversation hash based on wordId
 * 2. Check GCS cache for existing conversation
 * 3. If cache hit: download and parse cached JSON
 * 4. If cache miss:
 *    a. Generate prompt via promptUtils
 *    b. Call Gemini API for raw conversation text
 *    c. Parse response into ConversationTurn[] structure
 *    d. Upload to GCS cache
 * 5. Return conversation object
 *
 * @structure ConversationTurn
 * {
 *   speaker: "A" | "B" | string,
 *   chinese: string,
 *   pinyin: string,
 *   english: string,
 *   audioUrl?: string  // Populated separately via /api/conversation with type: "audio"
 * }
 *
 * @caching GCS path: `conversation/text/{wordId}/{hash}.json`
 * @dependencies
 * - services/geminiService.js - Gemini API client
 * - services/gcsService.js - Cache storage operations
 * - utils/promptUtils.js - Prompt generation
 * - utils/conversationUtils.js - Response parsing
 * - utils/hashUtils.js - Cache key generation
 *
 * @architecture Pure function (no Express or Vercel coupling)
 * @shared Used by both local-backend and Vercel API
 */
import { config } from "../config/index.js";
import { createLogger } from "../utils/logger.js";
import * as geminiService from "./geminiService.js";
import * as ttsService from "./ttsService.js";
import * as gcsService from "./gcsService.js";
import { extractTextFromConversation } from "../utils/conversationUtils.js";
import { computeConversationTextHash } from "../utils/hashUtils.js";
import { createConversationPrompt } from "../utils/promptUtils.js";

const logger = createLogger("ConversationService");

function parseConversationText(rawText) {
  const lines = rawText.split("\n").filter((line) => line.trim());
  const turns = [];
  for (const line of lines) {
    const trimmed = line.trim();
    let speaker = null;
    let chinese = "";
    let pinyin = "";
    let english = "";
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
      turns.push({ speaker, chinese, pinyin, english, audioUrl: "" });
    }
  }
  if (turns.length < 3) {
    logger.warn("Not enough turns generated, using fallback");
    return [
      { speaker: "A", chinese: "你好，今天天气真好。", pinyin: "", english: "", audioUrl: "" },
      { speaker: "B", chinese: "是的，我们去公园走走吧。", pinyin: "", english: "", audioUrl: "" },
      { speaker: "A", chinese: "好主意，我们现在就走。", pinyin: "", english: "", audioUrl: "" },
    ];
  }
  return turns.slice(0, 5);
}

export async function generateConversationText(wordId, word, generatorVersion = "v1") {
  const hash = computeConversationTextHash(wordId);
  const cachePath = config.cachePaths.conversationText
    .replace("{wordId}", wordId)
    .replace("{hash}", hash);
  const exists = await gcsService.fileExists(cachePath);
  if (exists) {
    logger.info(`Cache hit: ${cachePath}`);
    const buffer = await gcsService.downloadFile(cachePath);
    return JSON.parse(buffer.toString());
  }
  logger.info(`Cache miss: ${cachePath}`);
  logger.info(`Generating conversation for word: ${word} (${wordId})`);
  const prompt = createConversationPrompt(word, { requireRichTurn: true });
  const rawText = await geminiService.generateText(prompt, {
    model: config.gemini.model,
    temperature: config.gemini.temperature,
    maxTokens: config.gemini.maxTokens,
  });
  const turns = parseConversationText(rawText);
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
  const buffer = Buffer.from(JSON.stringify(conversation));
  await gcsService.uploadFile(cachePath, buffer, "application/json");
  logger.info(`Successfully cached: ${cachePath}`);
  return conversation;
}

export async function generateTurnAudio(wordId, turnIndex, text, voice = config.tts.voiceDefault) {
  const hash = computeConversationTextHash(wordId);
  const conversationId = `${wordId}-${hash}`;
  const conversationPath = config.cachePaths.conversationText
    .replace("{wordId}", wordId)
    .replace("{hash}", hash);
  const conversationExists = await gcsService.fileExists(conversationPath);
  if (!conversationExists) {
    throw new Error(`Conversation not found for wordId: ${wordId}. Generate text first.`);
  }
  const buffer = await gcsService.downloadFile(conversationPath);
  const conversation = JSON.parse(buffer.toString());
  if (!conversation.turns || !conversation.turns[turnIndex]) {
    throw new Error(`Turn ${turnIndex} not found in conversation`);
  }
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
  const crypto = await import("crypto");
  const turnAudioHash = crypto.createHash("sha256").update(text).digest("hex");
  const turnAudioPath = config.cachePaths.conversationAudio
    .replace("{wordId}", wordId)
    .replace("{hash}", `${hash}-turn${turnIndex + 1}-${turnAudioHash}`);
  let audioUrl = "";
  if (await gcsService.fileExists(turnAudioPath)) {
    audioUrl = gcsService.getPublicUrl(turnAudioPath);
  } else {
    const audioBuffer = await ttsService.synthesizeSpeech(text, { voice });
    await gcsService.uploadFile(turnAudioPath, audioBuffer, "audio/mpeg");
    audioUrl = gcsService.getPublicUrl(turnAudioPath);
  }
  conversation.turns[turnIndex].audioUrl = audioUrl;
  await gcsService.uploadFile(
    conversationPath,
    Buffer.from(JSON.stringify(conversation)),
    "application/json"
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
