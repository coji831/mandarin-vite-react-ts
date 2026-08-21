/**
 * @file apps/backend/src/modules/grammar/nest/grammar-nest.controller.ts
 * @description NestJS controller for the Grammar module (Story 24-2 shell).
 *
 * Mirrors `api/GrammarController.ts` (Express) 1:1 — same query coercion, same
 * service delegation, same 2xx JSON. Bypasses the `req.grammarController`
 * pattern; throws `BadRequestException` / `NotFoundException` on 4xx (envelope
 * parity deferred to 24-3).
 *
 * Route patterns copied verbatim from `api/grammarRoutes.ts`
 * (`ROUTE_PATTERNS.grammarPatterns` + `grammarPatternById(":id")`).
 */

import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Query,
} from "@nestjs/common";
import { createLogger } from "../../../shared/utils/logger.js";
import { GrammarService } from "../services/GrammarService.js";
import { GrammarNotFoundError, GrammarValidationError } from "../types/grammar.js";

// ── Constants ──────────────────────────────────────────────────────────────

/** Regular expression matching a grammar business key (`gr_XXXX`). */
const GRAMMAR_ID_REGEX = /^gr_\d+$/;

const logger = createLogger("GrammarNestController");

/**
 * NestJS controller for grammar pattern operations (Story 24-2 shell).
 */
@Controller("v1/grammar/patterns")
export class GrammarNestController {
  constructor(@Inject(GrammarService) private readonly service: GrammarService) {}

  /**
   * GET /api/v1/grammar/patterns
   * List patterns with optional `search` / `hskLevel` / `phase` filters and
   * `page` / `pageSize` pagination. All filters are optional and additive.
   */
  @Get()
  async list(@Query() query: Record<string, unknown>): Promise<unknown> {
    const search = typeof query.search === "string" ? query.search.trim() : undefined;
    const hskLevel = query.hskLevel !== undefined ? Number(query.hskLevel) : undefined;
    const phase = query.phase !== undefined ? Number(query.phase) : undefined;
    const page = query.page !== undefined ? Number(query.page) : undefined;
    const pageSize = query.pageSize !== undefined ? Number(query.pageSize) : undefined;

    try {
      return await this.service.listPatterns({ search, hskLevel, phase, page, pageSize });
    } catch (err) {
      if (err instanceof GrammarValidationError) {
        throw new BadRequestException();
      }
      logger.error("Failed to load grammar patterns", err);
      throw new InternalServerErrorException();
    }
  }

  /**
   * GET /api/v1/grammar/patterns/:id
   * Get a single pattern by its `content_id` business key (`gr_XXXX`).
   */
  @Get(":id")
  async getById(@Param("id") id: string): Promise<unknown> {
    const patternId = String(id);

    if (!patternId || !GRAMMAR_ID_REGEX.test(patternId)) {
      throw new BadRequestException();
    }

    try {
      return await this.service.getPattern(patternId);
    } catch (err) {
      if (err instanceof GrammarNotFoundError) {
        throw new NotFoundException();
      }
      logger.error(`Failed to load grammar pattern ${patternId}`, err);
      throw new InternalServerErrorException();
    }
  }
}
