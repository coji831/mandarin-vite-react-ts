/**
 * @file api/conversation.js
 * @description Vercel serverless handler for unified Conversation API endpoint.
 *
 * This handler provides a stateless entry point for the /api/conversation endpoint,
 * supporting both conversation text generation and per-turn audio generation via
 * type-based routing.
 *
 * @endpoint POST /api/conversation
 * @request { type: "text", wordId: string, word: string } - Generate conversation turns
 * @request { type: "audio", wordId: string, turnIndex: number, text: string, voice?: string } - Generate turn audio
 * @response { conversation: object, mode: string } - For type: "text"
 * @response { audioUrl: string } - For type: "audio"
 *
 * @architecture Vercel Serverless Function (stateless, no Express)
 * @see apps/backend/docs/api-spec.md for full endpoint documentation
 */
import { config } from "../apps/backend/config/index.js";
import * as conversationService from "../apps/backend/services/conversationService.js";
import { createConversationResponse } from "../apps/backend/utils/conversationUtils.js";
import { createLogger } from "../apps/backend/utils/logger.js";

const logger = createLogger("Conversation");

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const startTime = Date.now();

  try {
    logger.requestReceived(req.method, req.url);

    // Handle health check (GET /api/conversation?health or GET /api/conversation/health)
    if (req.method === "GET") {
      logger.requestCompleted(req.method, req.url, 200, Date.now() - startTime);
      return res.json({
        mode: config.conversationMode,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    }

    // Only allow POST for main functionality
    if (req.method !== "POST") {
      logger.requestCompleted(req.method, req.url, 405, Date.now() - startTime);
      return res.status(405).json({
        code: "METHOD_NOT_ALLOWED",
        message: "Method Not Allowed",
      });
    }

    const { type } = req.body || {};

    if (type === "text") {
      // ========== TEXT GENERATION ==========
      const { wordId, word, generatorVersion = "v1" } = req.body;

      if (!wordId || !word) {
        logger.requestCompleted(req.method, req.url, 400, Date.now() - startTime);
        return res.status(400).json({
          code: "VALIDATION_ERROR",
          message: "wordId and word are required for text generation",
          metadata: {
            missing: [!wordId && "wordId", !word && "word"].filter(Boolean),
          },
        });
      }

      logger.info(`Generating conversation text for: ${word} (${wordId})`);

      try {
        const conversation = await conversationService.generateConversationText(
          wordId,
          word,
          generatorVersion
        );
        logger.requestCompleted(req.method, req.url, 200, Date.now() - startTime);
        return res.json(createConversationResponse(conversation, "real"));
      } catch (error) {
        logger.error(`Conversation text generation error: ${error.message}`, {
          wordId,
          word,
          stack: error.stack,
        });
        logger.requestCompleted(req.method, req.url, 500, Date.now() - startTime);
        return res.status(500).json({
          code: "CONVO_TEXT_ERROR",
          message: error.message,
          metadata: { wordId, word },
        });
      }
    } else if (type === "audio") {
      // ========== AUDIO GENERATION ==========
      const { wordId, turnIndex, text, voice } = req.body;

      if (!wordId || typeof turnIndex !== "number" || !text) {
        logger.requestCompleted(req.method, req.url, 400, Date.now() - startTime);
        return res.status(400).json({
          code: "VALIDATION_ERROR",
          message: "wordId, turnIndex, and text are required for audio generation",
          metadata: {
            missing: [
              !wordId && "wordId",
              typeof turnIndex !== "number" && "turnIndex",
              !text && "text",
            ].filter(Boolean),
          },
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
        logger.requestCompleted(req.method, req.url, 200, Date.now() - startTime);
        return res.json(audioMetadata);
      } catch (error) {
        logger.error(`Conversation audio generation error: ${error.message}`, {
          wordId,
          turnIndex,
          stack: error.stack,
        });
        logger.requestCompleted(req.method, req.url, 500, Date.now() - startTime);
        return res.status(500).json({
          code: "CONVO_AUDIO_ERROR",
          message: error.message,
          metadata: { wordId, turnIndex },
        });
      }
    } else {
      logger.requestCompleted(req.method, req.url, 400, Date.now() - startTime);
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "type field is required and must be 'text' or 'audio'",
        metadata: { provided: type },
      });
    }
  } catch (error) {
    logger.error(`Unhandled error in conversation handler: ${error.message}`, {
      stack: error.stack,
    });
    logger.requestCompleted(req.method, req.url, 500, Date.now() - startTime);
    return res.status(500).json({
      code: "INTERNAL_ERROR",
      message: error.message || "Internal server error",
    });
  }
}
