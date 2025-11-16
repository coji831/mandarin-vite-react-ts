// Health Controller
import express from "express";
import { ROUTE_PATTERNS } from "../../shared/constants/apiPaths.js";
import { config } from "../config/index.js";
import { createHealthResponse } from "../utils/conversationUtils.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = express.Router();

// Health check endpoint
router.get(
  ROUTE_PATTERNS.conversationHealth,
  asyncHandler(
    async (req, res) => {
      res.json(createHealthResponse(config.conversationMode));
    },
    { logPrefix: "Health" }
  )
);

export default router;
