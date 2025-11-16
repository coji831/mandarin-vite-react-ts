// Scaffold Controller
// Handles static file serving and scaffold-mode specific endpoints
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { ROUTE_PATTERNS } from "../../shared/constants/apiPaths.js";
import { config } from "../config/index.js";
import { createLogger } from "../utils/logger.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validationError } from "../utils/errorFactory.js";
import { createConversationResponse } from "../utils/conversationUtils.js";
import { handleGetScaffoldText, getScaffoldAudioMetadata } from "../utils/scaffoldUtils.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logger = createLogger("Scaffold");
const router = express.Router();

/**
 * Configure scaffold mode routes
 * Only active when CONVERSATION_MODE=scaffold
 */
export function configureScaffoldRoutes(app) {
  if (config.conversationMode !== "scaffold") {
    logger.info("Scaffold mode disabled, skipping scaffold routes");
    return;
  }

  // Serve static vocabulary data files
  app.use("/data", express.static(path.join(__dirname, "..", "..", "public", "data")));

  // CORS headers for audio files
  app.use("/data/examples/conversations/audio", (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Range");
    res.header("Access-Control-Expose-Headers", "Content-Range, Content-Length");
    next();
  });

  // Scaffold-specific conversation text endpoint
  app.post(
    ROUTE_PATTERNS.conversationTextGenerate,
    asyncHandler(
      async (req, res) => {
        const { wordId, word } = req.body || {};

        if (!wordId) {
          throw validationError("wordId is required in request body", { field: "wordId" });
        }

        logger.info(`Scaffold text generation for wordId: ${wordId}`);
        const conversation = await handleGetScaffoldText(wordId, word);
        res.json(createConversationResponse(conversation, "scaffold"));
      },
      { logPrefix: "ScaffoldConversationText" }
    )
  );

  // Scaffold-specific conversation audio endpoint
  app.post(
    ROUTE_PATTERNS.conversationAudioGenerate,
    asyncHandler(
      async (req, res) => {
        const {
          wordId,
          voice = config.tts.voiceDefault,
          bitrate = 128,
          format = "url",
        } = req.body || {};

        if (!wordId) {
          throw validationError("wordId is required in request body", { field: "wordId" });
        }

        logger.info(`Scaffold audio generation for wordId: ${wordId}`);
        const audioMetadata = await getScaffoldAudioMetadata(wordId, format);
        res.json({ ...audioMetadata, voice, bitrate, cached: Math.random() > 0.3 });
      },
      { logPrefix: "ScaffoldConversationAudio" }
    )
  );

  logger.info("Scaffold routes configured: static data serving + conversation endpoints enabled");
}

export default router;
