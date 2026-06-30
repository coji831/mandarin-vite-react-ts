/**
 * @file apps/backend/src/modules/radicals/api/radicalsRoutes.js
 * @description Routes for serving radical reference data
 *
 * Controller is injected via req.radicalsController middleware.
 * PUBLIC data — no authentication required (radicals are static reference content).
 */
import express from "express";
import { asyncHandler } from "../../../shared/middleware/asyncHandler.js";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";

const router = express.Router();

/**
 * GET /v1/radicals
 * Returns all radicals from content/radicals/ JSON files.
 * No authentication required — radicals are static reference data.
 */
router.get(
  ROUTE_PATTERNS.radicals,
  asyncHandler((req, res) => req.radicalsController.getAllRadicals(req, res)),
);

/**
 * GET /v1/radicals/:radicalId
 * Returns a single radical by ID.
 * No authentication required — radicals are static reference data.
 */
router.get(
  ROUTE_PATTERNS.radicalsById(":radicalId"),
  asyncHandler((req, res) => req.radicalsController.getRadicalById(req, res)),
);

/**
 * GET /v1/radicals/character/:glyph
 * Returns radicals that compose the given character glyph.
 * No authentication required — static reference data.
 */
router.get(
  ROUTE_PATTERNS.radicalsByCharacter(":glyph"),
  asyncHandler((req, res) => req.radicalsController.getRadicalsByCharacter(req, res)),
);

export default router;
