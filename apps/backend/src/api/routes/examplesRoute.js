import express from "express";
import { rateLimit } from "express-rate-limit";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import ExampleService from "../../services/exampleService.js";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import { createLogger } from "../../utils/logger.js";

const router = express.Router();

const exampleService = new ExampleService();
const logger = createLogger("ExamplesRoute");

// Rate limiter for examples endpoint (prevent abuse / cold-cache attacks)
const examplesLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 requests per windowMs
  message: { error: "Too many example requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /v1/examples/single-line
router.post(
  ROUTE_PATTERNS.examples + ROUTE_PATTERNS.examplesSingleLine,
  authenticateToken,
  examplesLimiter,
  asyncHandler(
    async (req, res) => {
      const payload = req.body;
      const result = await exampleService.generateSingleLineExample(payload);
      res.status(200).json({ data: result });
    },
    {
      logPrefix: "ExamplesRoute",
      validateSchema: (body) => ({
        valid: !!body && typeof body.word === "string" && Number.isInteger(Number(body.hskLevel)),
        error: "Missing required fields: word or hskLevel",
      }),
    },
  ),
);

// GET /v1/examples/audio
// Returns cached audio URL or generates new audio via TTS
router.get(
  ROUTE_PATTERNS.examples + ROUTE_PATTERNS.examplesAudio,
  authenticateToken,
  asyncHandler(
    async (req, res) => {
      const { cacheKey } = req.query;

      if (!cacheKey || typeof cacheKey !== "string") {
        return res.status(400).json({ error: "Missing or invalid cacheKey" });
      }

      try {
        // Call service to get or generate audio URL
        const audioUrl = await exampleService.getOrGenerateAudio(cacheKey);
        res.status(200).json({ audio_url: audioUrl });
      } catch (err) {
        logger.error("Audio endpoint error", { cacheKey, err: err?.message });
        throw err; // asyncHandler will format as 500
      }
    },
    { logPrefix: "ExamplesAudioRoute" },
  ),
);

export default router;
