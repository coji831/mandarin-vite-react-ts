// Health Controller
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import express from "express";
import { config } from "../config/index.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { createHealthResponse } from "../utils/conversationUtils.js";

const router = express.Router();

// Health check endpoint
router.get(
  ROUTE_PATTERNS.health,
  asyncHandler(
    async (req, res) => {
      res.json(createHealthResponse(config.conversationMode));
    },
    { logPrefix: "Health" }
  )
);

export default router;
