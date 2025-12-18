// Health Controller
import express from "express";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import { config } from "../config/index.js";
import { createHealthResponse } from "../utils/conversationUtils.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = express.Router();

// Health check endpoint
router.get(
  "/",
  asyncHandler(
    async (req, res) => {
      res.json(createHealthResponse(config.conversationMode));
    },
    { logPrefix: "Health" }
  )
);

export default router;
