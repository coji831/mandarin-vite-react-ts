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
// GET /health (mounted at /mandarin/conversation)
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
// POST /text/generate (mounted at /mandarin/conversation)
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
// POST /audio/generate (mounted at /mandarin/conversation)
// On-demand per-turn audio generation
router.post(
  ROUTE_PATTERNS.conversationAudioGenerate,
  asyncHandler(
    async (req, res) => {
      const { wordId, turnIndex, text, voice } = req.body || {};

      if (!wordId || typeof turnIndex !== "number" || !text) {
        throw validationError("wordId, turnIndex, and text are required", {
          missing: [
            !wordId && "wordId",
            typeof turnIndex !== "number" && "turnIndex",
            !text && "text",
          ].filter(Boolean),
        });
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
        throw convoAudioError(error.message, { wordId, turnIndex });
      }
    },
    { logPrefix: "ConversationAudio" }
  )
);

export default router;
