/**
 * Conversation Controller (Real Mode Only)
 * Handles conversation text and audio generation endpoints.
 * Scaffold mode conversation logic is in scaffoldController.js
 */

import express from "express";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import { config } from "../config/index.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import * as conversationService from "../services/conversationService.js";
import * as geminiService from "../services/geminiService.js";
import * as ttsService from "../services/ttsService.js";
import { createConversationResponse } from "../utils/conversationUtils.js";
import { convoAudioError, convoTextError, validationError } from "../utils/errorFactory.js";
import { createLogger } from "../utils/logger.js";
import { CachedConversationService } from "../services/conversation/CachedConversationService.js";
import { getCacheService } from "../services/cache/index.js";
import { registerCacheMetrics } from "../middleware/cacheMetrics.js";

const router = express.Router();
const logger = createLogger("ConversationController");

// Initialize conversation service with caching
const cacheService = getCacheService();
const cachedConversationService = new CachedConversationService(conversationService, cacheService);

// Register metrics for monitoring
registerCacheMetrics("Conversation", () => cachedConversationService.getMetrics());

// ============================================================================
// UNIFIED CONVERSATION ENDPOINT (type-based routing)
// ============================================================================
// POST / (mounted at /api/conversation)
// Handles both text and audio generation based on { type: "text" | "audio" }
router.post(
  `${ROUTE_PATTERNS.conversation}`,
  asyncHandler(
    async (req, res) => {
      const { type } = req.body || {};

      if (type === "text") {
        // Text generation
        const { wordId, word, generatorVersion = "v1" } = req.body;

        if (!wordId || !word) {
          throw validationError("wordId and word are required for text generation", {
            missing: [!wordId && "wordId", !word && "word"].filter(Boolean),
          });
        }

        logger.info(`Generating conversation text for: ${word} (${wordId})`);

        try {
          const conversation = await cachedConversationService.generateConversationText(
            wordId,
            word,
            generatorVersion
          );
          res.json(createConversationResponse(conversation, "real"));
        } catch (error) {
          throw convoTextError(error.message, { wordId, word });
        }
      } else if (type === "audio") {
        // Audio generation
        const { wordId, turnIndex, text, voice } = req.body;

        if (!wordId || typeof turnIndex !== "number" || !text) {
          throw validationError("wordId, turnIndex, and text are required for audio generation", {
            missing: [
              !wordId && "wordId",
              typeof turnIndex !== "number" && "turnIndex",
              !text && "text",
            ].filter(Boolean),
          });
        }

        logger.info(`Generating audio for wordId: ${wordId}, turnIndex: ${turnIndex}`);

        try {
          const audioMetadata = await cachedConversationService.generateTurnAudio(
            wordId,
            turnIndex,
            text,
            voice
          );
          res.json(audioMetadata);
        } catch (error) {
          throw convoAudioError(error.message, { wordId, turnIndex });
        }
      } else {
        throw validationError("type field is required and must be 'text' or 'audio'", {
          provided: type,
        });
      }
    },
    { logPrefix: "Conversation" }
  )
);

// ============================================================================
// HEALTH CHECK
// ============================================================================
// GET /health (mounted at /mandarin/conversation)
router.get(
  `${ROUTE_PATTERNS.conversation}${ROUTE_PATTERNS.health}`,
  asyncHandler(
    async (req, res) => {
      const geminiOk = await geminiService.healthCheck().catch(() => false);
      const ttsOk = await ttsService.healthCheck().catch(() => false);
      res.json({
        mode: config.conversationMode,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
          gemini: geminiOk,
          tts: ttsOk,
        },
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
  `${ROUTE_PATTERNS.conversation}${ROUTE_PATTERNS.conversationTextGenerate}`,
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
        const conversation = await cachedConversationService.generateConversationText(
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
  `${ROUTE_PATTERNS.conversation}${ROUTE_PATTERNS.conversationAudioGenerate}`,
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
        const audioMetadata = await cachedConversationService.generateTurnAudio(
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
