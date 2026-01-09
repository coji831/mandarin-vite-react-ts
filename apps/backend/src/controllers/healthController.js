// Health Controller
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import express from "express";
import { config } from "../config/index.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { createHealthResponse } from "../utils/conversationUtils.js";
import * as geminiService from "../services/geminiService.js";
import * as ttsService from "../services/ttsService.js";

const router = express.Router();

// Health check endpoint
router.get(
  ROUTE_PATTERNS.health,
  asyncHandler(
    async (req, res) => {
      const base = createHealthResponse(config.conversationMode);
      const geminiOk = await geminiService.healthCheck().catch(() => false);
      const ttsOk = await ttsService.healthCheck().catch(() => false);
      res.json({
        ...base,
        services: {
          gemini: geminiOk,
          tts: ttsOk,
        },
      });
    },
    { logPrefix: "Health" }
  )
);

export default router;
