/**
 * @file apps/backend/src/modules/health/api/healthRoutes.js
 * @description Health check routes
 */

import express from "express";
import { asyncHandler } from "../../../shared/middleware/asyncHandler.js";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import { healthController } from "../../../app/container.js";

const router = express.Router();

// OpenAPI spec: see docs/openapi.yaml#/paths/~1v1~1health
router.get(
  ROUTE_PATTERNS.health as string,
  asyncHandler(healthController.checkHealth.bind(healthController)) as any,
);

export default router;
