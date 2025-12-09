// Main router entry point
import express from "express";
import { ROUTE_PATTERNS } from "../../shared/constants/apiPaths.js";
import ttsRouter from "../controllers/ttsController.js";
import conversationRouter from "../controllers/conversationController.js";
import healthRouter from "../controllers/healthController.js";

const router = express.Router();

// Use shared route patterns for consistency
router.use(ROUTE_PATTERNS.ttsAudio, ttsRouter);
router.use("/mandarin/conversation", conversationRouter);
router.use("/health", healthRouter);

export default router;
