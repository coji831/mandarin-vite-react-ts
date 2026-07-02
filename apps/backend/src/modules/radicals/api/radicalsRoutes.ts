/**
 * @file apps/backend/src/modules/radicals/api/radicalsRoutes.js
 * @description Routes for serving radical reference data
 *
 * Controller is injected via req.radicalsController middleware.
 * PUBLIC data — no authentication required (radicals are static reference content).
 */
import express from "express";
import type { Request, Response } from "express";
import { asyncHandler } from "../../../shared/middleware/asyncHandler.js";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";

const router = express.Router();

/**
 * GET /v1/radicals
 * Returns all radicals from content/radicals/ JSON files.
 * No authentication required — radicals are static reference data.
 */
router.get(
  ROUTE_PATTERNS.radicals as string,
  asyncHandler((req: Request, res: Response) =>
    req.radicalsController!.getAllRadicals(req, res),
  ) as any,
);

/**
 * GET /v1/radicals/:radicalId
 * Returns a single radical by ID.
 * No authentication required — radicals are static reference data.
 */
router.get(
  ROUTE_PATTERNS.radicalsById(":radicalId") as string,
  asyncHandler((req: Request, res: Response) =>
    req.radicalsController!.getRadicalById(req, res),
  ) as any,
);

/**
 * GET /v1/radicals/character/:glyph
 * Returns radicals that compose the given character glyph.
 * No authentication required — static reference data.
 */
router.get(
  ROUTE_PATTERNS.radicalsByCharacter(":glyph") as string,
  asyncHandler((req: Request, res: Response) =>
    req.radicalsController!.getRadicalsByCharacter(req, res),
  ) as any,
);

export default router;
