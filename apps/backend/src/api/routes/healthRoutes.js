/**
 * @file apps/backend/src/api/routes/healthRoutes.js
 * @description Health check routes
 */

import express from "express";
import { HealthController } from "../controllers/healthController.js";
import * as geminiClient from "../../infrastructure/external/GeminiClient.js";
import * as ttsClient from "../../infrastructure/external/GoogleTTSClient.js";
import { redisClient } from "../../infrastructure/cache/RedisClient.js";
import { getCacheMetrics } from "../middleware/cacheMetrics.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";

const router = express.Router();

// Initialize health controller with infrastructure clients
const healthController = new HealthController(
  geminiClient,
  ttsClient,
  redisClient.getClient(),
  getCacheMetrics,
);

// OpenAPI spec: see docs/openapi.yaml#/paths/~1v1~1health
router.get(
  ROUTE_PATTERNS.health,
  asyncHandler(healthController.checkHealth.bind(healthController)),
);

export default router;
