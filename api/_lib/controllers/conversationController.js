/**
 * @file api/_lib/controllers/conversationController.js
 * @description Conversation request routing and orchestration for Vercel serverless environment.
 *
 * This controller implements a unified conversation endpoint with type-based routing:
 * - type: "text" → Generate conversation turns with Chinese/pinyin/English
 * - type: "audio" → Generate audio for a specific conversation turn
 *
 * Refactored from separate Express routes to single unified handler for Vercel.
 *
 * @exports conversationController(req, res) - Main routing function
 * @exports generateConversationText(req, res) - Text generation handler
 * @exports generateTurnAudio(req, res) - Audio generation handler
 *
 * @flow (type: "text")
 * 1. Validate wordId and word parameters
 * 2. Generate conversation via conversationService (with caching)
 * 3. Return conversation object with ConversationTurn[] structure
 *
 * @flow (type: "audio")
 * 1. Validate conversationId, turnIndex, text, language
 * 2. Compute cache hash for turn audio
 * 3. Check GCS cache
 * 4. If miss: generate audio via ttsService, upload to GCS
 * 5. Return audio URL
 *
 * @dependencies
 * - services/conversationService.js - Conversation generation with Gemini API
 * - services/ttsService.js - Google Cloud TTS client
 * - services/gcsService.js - Google Cloud Storage operations
 * - utils/conversationUtils.js - Parsing and validation
 * - utils/hashUtils.js - Cache key generation
 * - utils/errorFactory.js - Error response creation
 *
 * @architecture Stateless controller with type-based routing (no Express)
 * @related local-backend/controllers/conversationController.js (Express version with separate routes)
 */
import { config } from "../config/index.js";
import * as conversationService from "../services/conversationService.js";
import { createConversationResponse } from "../utils/conversationUtils.js";
import { validationError, convoTextError, convoAudioError } from "../utils/errorFactory.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("ConversationController");

// Vercel handler signature: (req, res)
export async function conversationController(req, res) {
  // Only allow POST for text and audio generation
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  // Route based on a 'type' field in the body (text or audio)
  const { type } = req.body || {};
  if (type === "text") {
    // TEXT GENERATION
    const { wordId, word, generatorVersion = "v1" } = req.body || {};
    if (!wordId || !word) {
      const err = validationError("wordId and word are required", {
        missing: [!wordId && "wordId", !word && "word"].filter(Boolean),
      });
      res.status(400).json({ code: err.code, message: err.message, metadata: err.metadata });
      return;
    }
    logger.info(`Generating conversation text for: ${word} (${wordId})`);
    try {
      const conversation = await conversationService.generateConversationText(
        wordId,
        word,
        generatorVersion
      );
      res.json(createConversationResponse(conversation, "real"));
    } catch (error) {
      const err = convoTextError(error.message, { wordId, word });
      res.status(500).json({ code: err.code, message: err.message, metadata: err.metadata });
    }
    return;
  } else if (type === "audio") {
    // AUDIO GENERATION
    const { wordId, turnIndex, text, voice } = req.body || {};
    if (!wordId || typeof turnIndex !== "number" || !text) {
      const err = validationError("wordId, turnIndex, and text are required", {
        missing: [
          !wordId && "wordId",
          typeof turnIndex !== "number" && "turnIndex",
          !text && "text",
        ].filter(Boolean),
      });
      res.status(400).json({ code: err.code, message: err.message, metadata: err.metadata });
      return;
    }
    logger.info(`Generating audio for wordId: ${wordId}, turnIndex: ${turnIndex}`);
    try {
      const audioMetadata = await conversationService.generateTurnAudio(
        wordId,
        turnIndex,
        text,
        voice
      );
      res.json(audioMetadata);
    } catch (error) {
      const err = convoAudioError(error.message, { wordId, turnIndex });
      res.status(500).json({ code: err.code, message: err.message, metadata: err.metadata });
    }
    return;
  } else {
    res.status(400).json({ error: 'Invalid or missing type. Use type: "text" or "audio".' });
    return;
  }
}
