// Unified audio endpoint following code conventions
// Switches between scaffold and real mode based on CONVERSATION_MODE env var
import express from "express";
import { ROUTE_PATTERNS } from "../../shared/constants/apiPaths.js";
import { createHealthResponse } from "../utils/conversationUtils.js";

const router = express.Router();

// Environment configuration
const CONVERSATION_MODE = process.env.CONVERSATION_MODE;

// Health check endpoint
router.get(ROUTE_PATTERNS.conversationHealth, (req, res) => {
  res.json(createHealthResponse(CONVERSATION_MODE));
});

export default router;
