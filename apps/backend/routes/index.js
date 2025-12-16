// Main router entry point
import express from "express";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import ttsRouter from "../controllers/ttsController.js";
import conversationRouter from "../controllers/conversationController.js";
import healthRouter from "../controllers/healthController.js";
import authRouter from "../src/api/routes/auth.js";

const router = express.Router();

// Authentication routes (v1)
router.use("/v1/auth", authRouter);

// Use shared route patterns for consistency
router.use(ROUTE_PATTERNS.ttsAudio, ttsRouter);
router.use("/conversation", conversationRouter);
router.use("/health", healthRouter);

export default router;
