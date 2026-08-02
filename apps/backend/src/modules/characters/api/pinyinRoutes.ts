/**
 * @file apps/backend/src/modules/characters/api/pinyinRoutes.ts
 * @description Routes for pinyin search endpoints.
 *
 * Controller is injected via req.pinyinController middleware.
 * PUBLIC data — no authentication required (characters are static reference content).
 */

import express from "express";
import type { Request, Response } from "express";
import { asyncHandler } from "../../../shared/middleware/asyncHandler.js";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";

const router = express.Router();

/**
 * GET /v1/pinyin/search
 * Search characters by pinyin query.
 * Params: q (required), tone (optional 1-5), page, pageSize.
 * Public data — no authentication required.
 */
router.get(
  ROUTE_PATTERNS.pinyinSearch,
  asyncHandler((req: Request, res: Response) => req.pinyinController!.search(req, res)),
);

export default router;
