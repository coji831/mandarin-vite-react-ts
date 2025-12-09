/**
 * @file api/_lib/controllers/ttsController.js
 * @description TTS request validation and orchestration for Vercel serverless environment.
 *
 * This controller handles Text-to-Speech requests, validates input parameters,
 * checks GCS cache, generates audio via ttsService, and returns public URLs.
 * Refactored from Express middleware to plain async function for Vercel compatibility.
 *
 * @exports ttsController(req, res) - Main handler function
 *
 * @flow
 * 1. Validate HTTP method (POST only)
 * 2. Validate request body (text, language, voiceName)
 * 3. Compute cache hash based on text + language + voice
 * 4. Check GCS cache for existing audio
 * 5. If cache hit: return cached URL
 * 6. If cache miss: generate audio via ttsService, upload to GCS, return URL
 * 7. Handle errors inline (no Express middleware)
 *
 * @dependencies
 * - services/ttsService.js - Google Cloud TTS client
 * - services/gcsService.js - Google Cloud Storage operations
 * - utils/hashUtils.js - Cache key generation
 * - utils/errorFactory.js - Error response creation
 *
 * @architecture Stateless controller (no Express coupling)
 * @related local-backend/controllers/ttsController.js (Express version with asyncHandler)
 */
import { config } from "../config/index.js";
import { synthesizeSpeech } from "../services/ttsService.js";
import * as gcsService from "../services/gcsService.js";
import { computeTTSHash } from "../utils/hashUtils.js";
import { validationError, ttsError } from "../utils/errorFactory.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("TTS");

// Vercel handler signature: (req, res)
export async function ttsController(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }
  const { text, voice = config.tts.voiceDefault } = req.body || {};

  if (!text || text.trim() === "") {
    const err = validationError("Text is required.", { field: "text" });
    res.status(400).json({ code: err.code, message: err.message, metadata: err.metadata });
    return;
  }

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0 || words.length > config.tts.maxWords) {
    const err = validationError(`Please enter between 1 and ${config.tts.maxWords} words.`, {
      wordCount: words.length,
      field: "text",
    });
    res.status(400).json({ code: err.code, message: err.message, metadata: err.metadata });
    return;
  }

  const hash = computeTTSHash(text, voice);
  const cachePath = config.cachePaths.tts.replace("{hash}", hash);

  try {
    const exists = await gcsService.fileExists(cachePath);
    let cached = false;
    if (exists) {
      logger.info(`Cache hit: ${cachePath}`);
      cached = true;
    } else {
      logger.info(`Cache miss: ${cachePath}`);
      const audioBuffer = await synthesizeSpeech(text, { voice });
      await gcsService.uploadFile(cachePath, audioBuffer, "audio/mpeg");
      logger.info(`Successfully cached: ${cachePath}`);
    }
    const audioUrl = gcsService.getPublicUrl(cachePath);
    res.status(200).json({ audioUrl, cached });
  } catch (error) {
    let err;
    if (error.code === 7 || error.details?.includes("API key not valid")) {
      err = ttsError("Authentication error with TTS/GCS API. Check logs.", {
        originalError: error.message,
      });
    } else if (error.code === 3 && error.details?.includes("Billing account not enabled")) {
      err = ttsError("Google Cloud Billing not enabled. Check logs.", {
        originalError: error.message,
      });
    } else if (error.code === 403 && error.details?.includes("Forbidden")) {
      err = ttsError(
        "GCS permission denied. Ensure service account has Storage Object Creator/Viewer roles.",
        { originalError: error.message }
      );
    } else {
      err = ttsError(error.message || "TTS generation failed", { originalError: error.message });
    }
    res.status(500).json({ code: err.code, message: err.message, metadata: err.metadata });
  }
}
