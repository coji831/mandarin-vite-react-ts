/**
 * @file apps/backend/src/api/controllers/conversationController.js
 * @description Conversation Controller (Real Mode Only)
 * Handles conversation text and audio generation endpoints
 * Clean architecture: API layer - handles HTTP mapping only
 */

import { createConversationResponse } from "../../utils/conversationUtils.js";
import { convoAudioError, convoTextError, validationError } from "../../utils/errorFactory.js";
import { createLogger } from "../../utils/logger.js";

const logger = createLogger("ConversationController");

/**
 * ConversationController handles HTTP requests for conversation generation
 * @class
 */
class ConversationController {
  /**
   * @param {Object} conversationService - Conversation business logic service
   */
  constructor(conversationService) {
    this.conversationService = conversationService;
  }

  /**
   * Unified conversation endpoint (type-based routing)
   * POST / (mounted at /api/conversation)
   * Handles both text and audio generation based on { type: "text" | "audio" }
   */
  async generateConversation(req, res) {
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
        const conversation = await this.conversationService.generateConversationText(
          wordId,
          word,
          generatorVersion,
        );
        res.json(createConversationResponse(conversation));
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
        const audioMetadata = await this.conversationService.generateTurnAudio(
          wordId,
          turnIndex,
          text,
          voice,
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
  }

  /**
   * Text generation endpoint
   * POST /text/generate (mounted at /mandarin/conversation)
   */
  async generateText(req, res) {
    const { wordId, word, generatorVersion = "v1" } = req.body || {};

    if (!wordId || !word) {
      throw validationError("wordId and word are required", {
        missing: [!wordId && "wordId", !word && "word"].filter(Boolean),
      });
    }

    logger.info(`Generating conversation text for: ${word} (${wordId})`);

    try {
      const conversation = await this.conversationService.generateConversationText(
        wordId,
        word,
        generatorVersion,
      );
      res.json(createConversationResponse(conversation));
    } catch (error) {
      throw convoTextError(error.message, { wordId, word });
    }
  }

  /**
   * Audio generation endpoint
   * POST /audio/generate (mounted at /mandarin/conversation)
   * On-demand per-turn audio generation
   */
  async generateAudio(req, res) {
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
      const audioMetadata = await this.conversationService.generateTurnAudio(
        wordId,
        turnIndex,
        text,
        voice,
      );
      res.json(audioMetadata);
    } catch (error) {
      throw convoAudioError(error.message, { wordId, turnIndex });
    }
  }
}

export default ConversationController;
