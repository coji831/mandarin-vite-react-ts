// TTS Controller
import express from "express";
import { ROUTE_PATTERNS } from "../../shared/constants/apiPaths.js";

import { config } from "../config/index.js";
import { synthesizeSpeech } from "../services/ttsService.js";
import * as gcsService from "../services/gcsService.js";
import { computeTTSHash } from "../utils/hashUtils.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validationError, ttsError } from "../utils/errorFactory.js";
import { createLogger } from "../utils/logger.js";

const router = express.Router();
const logger = createLogger("TTS");

// POST /get-tts-audio
router.post(
  "/",
  asyncHandler(
    async (req, res) => {
      const { text, voice = config.tts.voiceDefault } = req.body;

      if (!text || text.trim() === "") {
        throw validationError("Text is required.", { field: "text" });
      }

      // Input validation: 1-15 words
      const words = text.split(/\s+/).filter(Boolean);
      if (words.length === 0 || words.length > config.tts.maxWords) {
        throw validationError(`Please enter between 1 and ${config.tts.maxWords} words.`, {
          wordCount: words.length,
          field: "text",
        });
      }

      // Generate hash for caching (include voice in hash)
      const hash = computeTTSHash(text, voice);
      const cachePath = config.cachePaths.tts.replace("{hash}", hash);

      try {
        // Check cache first
        const exists = await gcsService.fileExists(cachePath);
        let cached = false;

        if (exists) {
          logger.info(`Cache hit: ${cachePath}`);
          cached = true;
        } else {
          // Cache miss - generate and store
          logger.info(`Cache miss: ${cachePath}`);
          const audioBuffer = await synthesizeSpeech(text, { voice });
          await gcsService.uploadFile(cachePath, audioBuffer, "audio/mpeg");
          logger.info(`Successfully cached: ${cachePath}`);
        }

        const audioUrl = gcsService.getPublicUrl(cachePath);
        res.status(200).json({ audioUrl, cached });
      } catch (error) {
        // Enhanced error handling with specific error codes
        if (error.code === 7 || error.details?.includes("API key not valid")) {
          throw ttsError("Authentication error with TTS/GCS API. Check local backend logs.", {
            originalError: error.message,
          });
        } else if (error.code === 3 && error.details?.includes("Billing account not enabled")) {
          throw ttsError("Google Cloud Billing not enabled. Check local backend logs.", {
            originalError: error.message,
          });
        } else if (error.code === 403 && error.details?.includes("Forbidden")) {
          throw ttsError(
            "GCS permission denied. Ensure service account has Storage Object Creator/Viewer roles.",
            { originalError: error.message }
          );
        }
        throw ttsError(error.message || "TTS generation failed", {
          originalError: error.message,
        });
      }
    },
    { logPrefix: "TTS" }
  )
);

export default router;
