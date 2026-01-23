/**
 * @file apps/backend/src/api/routes/index.js
 * @description Main router entry point for clean architecture routes
 */

import express from "express";
import authRouter from "./auth.js";
import progressRouter from "./progress.js";
import conversationRouter from "./conversationRoutes.js";
import ttsRouter from "./ttsRoutes.js";
import vocabularyRouter from "./vocabularyRoutes.js";
import healthRouter from "./healthRoutes.js";

const router = express.Router();

// Health check routes
router.use(healthRouter);

// Authentication routes (v1)
router.use(authRouter);

// Progress routes (v1)
router.use(progressRouter);

// Conversation routes
router.use(conversationRouter);

// TTS routes
router.use(ttsRouter);

// Vocabulary routes (v1)
router.use(vocabularyRouter);

export default router;
