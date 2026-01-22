/**
 * @file apps/backend/src/api/routes/conversationRoutes.js
 * @description Conversation generation routes
 */

import express from "express";
import ConversationController from "../controllers/conversationController.js";
import { CachedConversationService } from "../../core/services/CachedConversationService.js";
import * as conversationService from "../../core/services/ConversationService.js";
import { getCacheService } from "../../infrastructure/cache/index.js";
import * as geminiClient from "../../infrastructure/external/GeminiClient.js";
import * as ttsClient from "../../infrastructure/external/GoogleTTSClient.js";
import * as gcsClient from "../../infrastructure/external/GCSClient.js";
import * as geminiService from "../../services/geminiService.js";
import * as ttsService from "../../services/ttsService.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { registerCacheMetrics } from "../../middleware/cacheMetrics.js";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";

const router = express.Router();

// Initialize conversation service with caching
const cacheService = getCacheService();
const cachedConversationService = new CachedConversationService(conversationService, cacheService);

// Initialize controller
const conversationController = new ConversationController(
  cachedConversationService,
  geminiService,
  ttsService,
);

// Register metrics for monitoring
registerCacheMetrics("Conversation", () => cachedConversationService.getMetrics());

// Unified conversation endpoint (type-based routing)
router.post(
  ROUTE_PATTERNS.conversation,
  asyncHandler(conversationController.generateConversation.bind(conversationController)),
);

// Health check endpoint
router.get(
  `${ROUTE_PATTERNS.conversation}${ROUTE_PATTERNS.health}`,
  asyncHandler(conversationController.healthCheck.bind(conversationController)),
);

// Text generation endpoint
router.post(
  `${ROUTE_PATTERNS.conversation}${ROUTE_PATTERNS.conversationTextGenerate}`,
  asyncHandler(conversationController.generateText.bind(conversationController)),
);

// Audio generation endpoint
router.post(
  `${ROUTE_PATTERNS.conversation}${ROUTE_PATTERNS.conversationAudioGenerate}`,
  asyncHandler(conversationController.generateAudio.bind(conversationController)),
);

export default router;
