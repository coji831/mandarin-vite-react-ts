// TTS Controller — migrated from modules/tts/api/TtsController.js
import { config } from "../config/index.js";
import { ttsError } from "../utils/errorFactory.js";
import { createLogger } from "../utils/logger.js";
import type { Request, Response } from "express";

const logger = createLogger("TTS");

/**
 * TtsController handles HTTP requests for text-to-speech generation
 * Thin HTTP layer — business logic delegated to TtsService.
 * @class
 */
class TtsController {
  private ttsService: {
    getTtsUrl(text: string, voice?: string): Promise<{ audioUrl: string; cached: boolean }>;
    healthCheck(): Promise<boolean>;
  };

  /**
   * @param ttsService - TTS service with business logic + caching
   */
  constructor(ttsService: {
    getTtsUrl(text: string, voice?: string): Promise<{ audioUrl: string; cached: boolean }>;
    healthCheck(): Promise<boolean>;
  }) {
    this.ttsService = ttsService;
  }

  /**
   * Generate TTS audio
   * POST / (mounted at ROUTE_PATTERNS.ttsAudio = "/get-tts-audio")
   */
  async getTtsAudio(req: Request, res: Response): Promise<void> {
    const { text, voice = config.tts.voiceDefault } = req.body;

    try {
      const { audioUrl, cached } = await this.ttsService.getTtsUrl(text, voice);
      res.status(200).json({ audioUrl, cached });
    } catch (error) {
      // Pass through known errors (validationError, ttsError) from the service
      const err = error as { code?: number; details?: string; message?: string };
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
      throw error; // Re-throw validationError and generic ttsError as-is
    }
  }
}

export default TtsController;
