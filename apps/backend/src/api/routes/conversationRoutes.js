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
import { authenticateToken } from "../middleware/authMiddleware.js";
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

// OpenAPI spec: see docs/openapi.yaml#/paths/~1v1~1conversations
router.post(
  ROUTE_PATTERNS.conversations,
  authenticateToken,
  asyncHandler(conversationController.generateConversation.bind(conversationController)),
);

// OpenAPI spec: see docs/openapi.yaml#/paths/~1v1~1conversations~1text~1generate
router.post(
  `${ROUTE_PATTERNS.conversations}${ROUTE_PATTERNS.conversationTextGenerate}`,
  authenticateToken,
  asyncHandler(conversationController.generateText.bind(conversationController)),
);

// OpenAPI spec: see docs/openapi.yaml#/paths/~1v1~1conversations~1audio~1generate
router.post(
  `${ROUTE_PATTERNS.conversations}${ROUTE_PATTERNS.conversationAudioGenerate}`,
  authenticateToken,
  asyncHandler(conversationController.generateAudio.bind(conversationController)),
);

export default router;
