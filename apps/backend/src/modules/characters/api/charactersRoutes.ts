/**
 * @file apps/backend/src/modules/characters/api/charactersRoutes.ts
 * @description Routes for character data endpoints.
 *
 * Controller is injected via req.charactersController middleware.
 * PUBLIC data — no authentication required (characters are static reference content).
 */

import express from "express";
import type { Request, Response } from "express";
import { asyncHandler } from "../../../shared/middleware/asyncHandler.js";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";

const router = express.Router();

/**
 * GET /v1/characters/:glyph
 * Returns full character details (pinyin, meanings, stroke count, radical, etc.).
 * Public data — no authentication required.
 */
router.get(
  ROUTE_PATTERNS.charactersByGlyph(":glyph"),
  asyncHandler((req: Request, res: Response) => req.charactersController!.getCharacter(req, res)),
);

/**
 * GET /v1/characters/:glyph/phonetic
 * Returns phonetic component info for the character.
 * Public data — no authentication required.
 */
router.get(
  ROUTE_PATTERNS.charactersPhonetic(":glyph"),
  asyncHandler((req: Request, res: Response) => req.charactersController!.getPhonetic(req, res)),
);

/**
 * GET /v1/characters/:glyph/homophones
 * Returns all characters sharing the same pronunciation, grouped by reading.
 * Public data — no authentication required.
 */
router.get(
  ROUTE_PATTERNS.charactersHomophones(":glyph"),
  asyncHandler((req: Request, res: Response) => req.charactersController!.getHomophones(req, res)),
);

/**
 * GET /v1/characters/:glyph/decomposition
 * Returns decomposition tree — constituent components with types and positions.
 * Public data — no authentication required.
 */
router.get(
  ROUTE_PATTERNS.charactersDecomposition(":glyph"),
  asyncHandler((req: Request, res: Response) =>
    req.charactersController!.getDecomposition(req, res),
  ),
);

/**
 * GET /v1/characters/search
 * Search characters by pinyin, tone filter, or HSK level.
 * Requires at least one filter parameter.
 * Public data — no authentication required.
 */
router.get(
  ROUTE_PATTERNS.charactersSearch,
  asyncHandler((req: Request, res: Response) => req.charactersController!.search(req, res)),
);

/**
 * GET /v1/characters/frequency
 * Returns characters ordered by frequency rank, optionally filtered by HSK tier.
 * Public data — no authentication required.
 */
router.get(
  ROUTE_PATTERNS.charactersFrequency,
  asyncHandler((req: Request, res: Response) => req.charactersController!.getFrequency(req, res)),
);

export default router;
