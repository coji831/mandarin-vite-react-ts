/**
 * @file apps/backend/src/modules/phonetic-clusters/api/phoneticClustersRoutes.ts
 * @description Routes for phonetic cluster endpoints.
 *
 * Controller is injected via req.phoneticClustersController middleware.
 * PUBLIC data — no authentication required.
 */

import express from "express";
import type { Request, Response } from "express";
import { asyncHandler } from "../../../shared/middleware/asyncHandler.js";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";

const router = express.Router();

/**
 * GET /v1/phonetic-clusters
 * Returns all phonetic clusters, optionally filtered by hskLevel query param.
 */
router.get(
  ROUTE_PATTERNS.phoneticClusters,
  asyncHandler((req: Request, res: Response) => req.phoneticClustersController!.list(req, res)),
);

/**
 * GET /v1/phonetic-clusters/:id
 * Returns a single phonetic cluster by ID with all members.
 */
router.get(
  ROUTE_PATTERNS.phoneticClustersById(":id"),
  asyncHandler((req: Request, res: Response) => req.phoneticClustersController!.getById(req, res)),
);

export default router;
