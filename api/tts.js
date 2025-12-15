/**
 * @file api/tts.js
 * @description Vercel serverless handler for Text-to-Speech API endpoint.
 *
 * This handler provides a stateless entry point for the /api/tts endpoint,
 * implementing direct request handling following Vercel best practices.
 *
 * @endpoint POST /api/tts
 * @request { text: string, voice?: string }
 * @response { audioUrl: string, cached: boolean }
 *
 * @architecture Vercel Serverless Function (stateless, no Express)
 * @see apps/backend/docs/api-spec.md for full endpoint documentation
 */
import { config } from "../apps/backend/config/index.js";
import { synthesizeSpeech } from "../apps/backend/services/ttsService.js";
import * as gcsService from "../apps/backend/services/gcsService.js";
import { computeTTSHash } from "../apps/backend/utils/hashUtils.js";
import { createLogger } from "../apps/backend/utils/logger.js";

const logger = createLogger("TTS");

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({
      code: "METHOD_NOT_ALLOWED",
      message: "Method Not Allowed",
    });
  }

  const startTime = Date.now();

  try {
    logger.requestReceived(req.method, req.url);

    const { text, voice = config.tts.voiceDefault } = req.body;

    // Validation: text required
    if (!text || text.trim() === "") {
      logger.requestCompleted(req.method, req.url, 400, Date.now() - startTime);
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "Text is required.",
        metadata: { field: "text" },
      });
    }

    // Input validation: 1-15 words
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length === 0 || words.length > config.tts.maxWords) {
      logger.requestCompleted(req.method, req.url, 400, Date.now() - startTime);
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: `Please enter between 1 and ${config.tts.maxWords} words.`,
        metadata: { wordCount: words.length, field: "text" },
      });
    }

    // Scaffold mode: return mock audio URL
    if (config.conversationMode === "scaffold") {
      const hash = computeTTSHash(text, voice);
      logger.info(`Scaffold mode: returning mock TTS for text: "${text}"`);
      logger.requestCompleted(req.method, req.url, 200, Date.now() - startTime);
      return res.status(200).json({
        audioUrl: `https://storage.googleapis.com/mandarin-tts-audio-dev/tts/${hash}.mp3`,
        cached: true,
        scaffold: true,
      });
    }

    // Generate hash for caching (include voice in hash)
    const hash = computeTTSHash(text, voice);
    const cachePath = config.cachePaths.tts.replace("{hash}", hash);

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
    logger.requestCompleted(req.method, req.url, 200, Date.now() - startTime);
    return res.status(200).json({ audioUrl, cached });
  } catch (error) {
    logger.error(`Error in TTS handler: ${error.message}`, {
      stack: error.stack,
      metadata: error.metadata,
    });

    // Enhanced error handling with specific error codes
    if (error.code === 7 || error.details?.includes("API key not valid")) {
      logger.requestCompleted(req.method, req.url, 500, Date.now() - startTime);
      return res.status(500).json({
        code: "TTS_ERROR",
        message: "Authentication error with TTS/GCS API. Check local backend logs.",
        metadata: { originalError: error.message },
      });
    } else if (error.code === 3 && error.details?.includes("Billing account not enabled")) {
      logger.requestCompleted(req.method, req.url, 500, Date.now() - startTime);
      return res.status(500).json({
        code: "TTS_ERROR",
        message: "Google Cloud Billing not enabled. Check local backend logs.",
        metadata: { originalError: error.message },
      });
    } else if (error.code === 403 && error.details?.includes("Forbidden")) {
      logger.requestCompleted(req.method, req.url, 500, Date.now() - startTime);
      return res.status(500).json({
        code: "TTS_ERROR",
        message:
          "GCS permission denied. Ensure service account has Storage Object Creator/Viewer roles.",
        metadata: { originalError: error.message },
      });
    }

    logger.requestCompleted(req.method, req.url, 500, Date.now() - startTime);
    return res.status(500).json({
      code: "TTS_ERROR",
      message: error.message || "TTS generation failed",
      metadata: { originalError: error.message },
    });
  }
}
