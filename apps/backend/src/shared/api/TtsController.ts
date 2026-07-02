// TTS Controller — migrated from modules/tts/api/TtsController.js
import { config } from "../config/index.js";
import { TTS_STORAGE_PATH } from "../config/tts.js";
import { computeTTSHash } from "../utils/hashUtils.js";
import { validationError, ttsError } from "../utils/errorFactory.js";
import { createLogger } from "../utils/logger.js";
import type { Request, Response } from "express";

const logger = createLogger("TTS");

/**
 * TtsController handles HTTP requests for text-to-speech generation
 * @class
 */
class TtsController {
  private ttsService: any;
  private gcsService: any;

  /**
   * @param ttsService - Text-to-speech service
   * @param gcsService - Google Cloud Storage service
   */
  constructor(ttsService: any, gcsService: any) {
    this.ttsService = ttsService;
    this.gcsService = gcsService;
  }

  /**
   * Generate TTS audio
   * POST / (mounted at ROUTE_PATTERNS.ttsAudio = "/get-tts-audio")
   */
  async getTtsAudio(req: Request, res: Response): Promise<void> {
    const { text, voice = config.tts.voiceDefault } = req.body;

    if (!text || text.trim() === "") {
      throw validationError("Text is required.");
    }

    // Input validation: 1-15 words
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length === 0 || words.length > config.tts.maxWords) {
      throw validationError(`Please enter between 1 and ${config.tts.maxWords} words.`);
    }

    // Generate hash for caching (include voice in hash)
    const hash = computeTTSHash(text, voice);
    const cachePath = TTS_STORAGE_PATH.replace("{hash}", hash);

    try {
      // Check cache first
      const exists = await this.gcsService.fileExists(cachePath);
      let cached = false;

      if (exists) {
        logger.info(`Cache hit: ${cachePath}`);
        cached = true;
      } else {
        // Cache miss - generate and store
        logger.info(`Cache miss: ${cachePath}`);
        const audioBuffer = await this.ttsService.synthesizeSpeech(text, { voice });
        await this.gcsService.uploadFile(cachePath, audioBuffer, "audio/mpeg");
        logger.info(`Successfully cached: ${cachePath}`);
      }

      const audioUrl = this.gcsService.getPublicUrl(cachePath);
      res.status(200).json({ audioUrl, cached });
    } catch (error) {
      // Enhanced error handling with specific error codes
      const err = error as any;
      if (err.code === 7 || err.details?.includes("API key not valid")) {
        throw ttsError("Authentication error with TTS/GCS API. Check local backend logs.", {
          originalError: err.message,
        });
      } else if (err.code === 3 && err.details?.includes("Billing account not enabled")) {
        throw ttsError("Google Cloud Billing not enabled. Check local backend logs.", {
          originalError: err.message,
        });
      } else if (err.code === 403 && err.details?.includes("Forbidden")) {
        throw ttsError(
          "GCS permission denied. Ensure service account has Storage Object Creator/Viewer roles.",
          { originalError: err.message },
        );
      }
      throw ttsError(err.message || "TTS generation failed", {
        originalError: err.message,
      });
    }
  }
}

export default TtsController;
