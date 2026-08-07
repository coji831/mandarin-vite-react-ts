/**
 * @file apps/backend/src/modules/chengyu/api/chengyuRoutes.ts
 * @description Routes for chengyu idiom endpoints.
 *
 * Controller is injected via req.chengyuController middleware.
 * PUBLIC data — no authentication required (chengyu is static reference content).
 *
 * Story 23.2 — Chengyu Backend API. Paths come verbatim from
 * `ROUTE_PATTERNS.chengyuIdioms` / `chengyuIdiomById`.
 */

import express from "express";
import type { Request, Response } from "express";
import { asyncHandler } from "../../../shared/middleware/asyncHandler.js";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";

const router = express.Router();

/**
 * GET /v1/chengyu/idioms
 * List idioms with optional search / theme / era filters + pagination.
 * Public data — no authentication required.
 */
router.get(
  ROUTE_PATTERNS.chengyuIdioms,
  asyncHandler((req: Request, res: Response) => req.chengyuController!.list(req, res)),
);

/**
 * GET /v1/chengyu/idioms/:id
 * Returns a single idiom by `content_id` ("cy_XXXX") with examples + relatedIdioms.
 * Public data — no authentication required.
 */
router.get(
  ROUTE_PATTERNS.chengyuIdiomById(":id"),
  asyncHandler((req: Request, res: Response) => req.chengyuController!.getById(req, res)),
);

export default router;
