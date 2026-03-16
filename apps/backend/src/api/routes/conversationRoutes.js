/**
 * @file apps/backend/src/api/routes/conversationRoutes.js
 * @description Conversation generation routes with proper DI wiring
 */

import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import { conversationController } from "../../container.js";

const router = express.Router();

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
