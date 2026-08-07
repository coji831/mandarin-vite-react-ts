/**
 * @file apps/backend/src/modules/grammar/api/grammarRoutes.ts
 * @description Routes for grammar pattern endpoints.
 *
 * Controller is injected via req.grammarController middleware.
 * PUBLIC data — no authentication required (grammar is static reference content).
 *
 * Story 22.2 — Grammar Backend API. Paths come verbatim from
 * `ROUTE_PATTERNS.grammarPatterns` / `grammarPatternById`.
 */

import express from "express";
import type { Request, Response } from "express";
import { asyncHandler } from "../../../shared/middleware/asyncHandler.js";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";

const router = express.Router();

/**
 * GET /v1/grammar/patterns
 * List patterns with optional search / hskLevel / phase filters + pagination.
 * Public data — no authentication required.
 */
router.get(
  ROUTE_PATTERNS.grammarPatterns,
  asyncHandler((req: Request, res: Response) => req.grammarController!.list(req, res)),
);

/**
 * GET /v1/grammar/patterns/:id
 * Returns a single pattern by `content_id` ("gr_XXXX") with examples + relatedPatterns.
 * Public data — no authentication required.
 */
router.get(
  ROUTE_PATTERNS.grammarPatternById(":id"),
  asyncHandler((req: Request, res: Response) => req.grammarController!.getById(req, res)),
);

export default router;
