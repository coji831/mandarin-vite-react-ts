/**
 * @file apps/backend/src/api/routes/conversationRoutes.js
 * @description Conversation generation routes with proper DI wiring
 */

import express from "express";
import ConversationController from "../controllers/conversationController.js";
import { ConversationService } from "../../core/services/ConversationService.js";
import { CachedConversationService } from "../../core/services/CachedConversationService.js";
import { getCacheService } from "../../infrastructure/cache/index.js";
import * as geminiClient from "../../infrastructure/external/GeminiClient.js";
import * as ttsClient from "../../infrastructure/external/GoogleTTSClient.js";
import * as gcsClient from "../../infrastructure/external/GCSClient.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { registerCacheMetrics } from "../middleware/cacheMetrics.js";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";

const router = express.Router();

// Initialize infrastructure clients
const cacheService = getCacheService();

// Initialize core conversation service with DI
const conversationService = new ConversationService(geminiClient, ttsClient, gcsClient);
const cachedConversationService = new CachedConversationService(conversationService, cacheService);

// Initialize controller with services (no longer needs geminiService/ttsService)
const conversationController = new ConversationController(cachedConversationService);

// Register metrics for monitoring
registerCacheMetrics("Conversation", () => cachedConversationService.getMetrics());

// Unified conversation endpoint (type-based routing)
router.post(
  ROUTE_PATTERNS.conversation,
  asyncHandler(conversationController.generateConversation.bind(conversationController)),
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
