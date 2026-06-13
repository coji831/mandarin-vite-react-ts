/**
 * @file apps/backend/src/modules/examples/api/examplesRoutes.js
 * @description Examples routes with clean architecture DI pattern
 */

import express from "express";
import { rateLimit } from "express-rate-limit";
import { asyncHandler } from "../../../shared/middleware/asyncHandler.js";
import { authenticateToken } from "../../../shared/middleware/authMiddleware.js";
import { exampleController } from "../../../app/container.js";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import { createLogger } from "../../../shared/utils/logger.js";

const router = express.Router();
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
      await exampleController.generateSingleLine(req, res);
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
router.get(
  ROUTE_PATTERNS.examples + ROUTE_PATTERNS.examplesAudio,
  authenticateToken,
  asyncHandler(
    async (req, res) => {
      await exampleController.getAudio(req, res);
    },
    { logPrefix: "ExamplesAudioRoute" },
  ),
);

export default router;
