/**
 * Conversation Controller (Real Mode Only)
 * Handles conversation text and audio generation endpoints.
 * Scaffold mode conversation logic is in scaffoldController.js
 */

import express from "express";
import { ROUTE_PATTERNS } from "../../shared/constants/apiPaths.js";
import { config } from "../config/index.js";
import * as conversationService from "../services/conversationService.js";
import { createConversationResponse } from "../utils/conversationUtils.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validationError, convoTextError, convoAudioError } from "../utils/errorFactory.js";
import { createLogger } from "../utils/logger.js";

const router = express.Router();
const logger = createLogger("ConversationController");

// ============================================================================
// HEALTH CHECK
// ============================================================================

router.get(
  "/health",
  asyncHandler(
    async (req, res) => {
      res.json({
        mode: config.conversationMode,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    },
    { logPrefix: "Conversation" }
  )
);

// ============================================================================
// TEXT GENERATION
// ============================================================================

router.post(
  ROUTE_PATTERNS.conversationTextGenerate,
  asyncHandler(
    async (req, res) => {
      const { wordId, word, generatorVersion = "v1" } = req.body || {};

      if (!wordId || !word) {
        throw validationError("wordId and word are required", {
          missing: [!wordId && "wordId", !word && "word"].filter(Boolean),
        });
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
        throw convoTextError(error.message, { wordId, word });
      }
    },
    { logPrefix: "ConversationText" }
  )
);

// ============================================================================
// AUDIO GENERATION
// ============================================================================

router.post(
  ROUTE_PATTERNS.conversationAudioGenerate,
  asyncHandler(
    async (req, res) => {
      const { wordId, voice } = req.body || {};

      if (!wordId) {
        throw validationError("wordId is required", { field: "wordId" });
      }

      logger.info(`Generating audio for wordId: ${wordId}`);

      try {
        const audioMetadata = await conversationService.generateConversationAudio(wordId, voice);
        res.json(audioMetadata);
      } catch (error) {
        throw convoAudioError(error.message, { wordId });
      }
    },
    { logPrefix: "ConversationAudio" }
  )
);

export default router;
