/**
 * @file apps/backend/src/modules/chengyu/nest/chengyu-nest.controller.ts
 * @description NestJS controller for the Chengyu module (Story 24-2 shell).
 *
 * Mirrors `api/ChengyuController.ts` (Express) 1:1 — same query coercion, same
 * service delegation, same 2xx JSON. Bypasses the `req.chengyuController`
 * pattern; throws `BadRequestException` / `NotFoundException` on 4xx (envelope
 * parity deferred to 24-3).
 *
 * Route patterns copied verbatim from `api/chengyuRoutes.ts`
 * (`ROUTE_PATTERNS.chengyuIdioms` + `chengyuIdiomById(":id")`).
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
import { ChengyuService } from "../services/ChengyuService.js";
import { ChengyuNotFoundError, ChengyuValidationError } from "../types/chengyu.js";

// ── Constants ──────────────────────────────────────────────────────────────

/** Regular expression matching a chengyu business key (`cy_XXXX`). */
const CHENGYU_ID_REGEX = /^cy_\d+$/;

const logger = createLogger("ChengyuNestController");

/**
 * NestJS controller for chengyu idiom operations (Story 24-2 shell).
 */
@Controller("v1/chengyu/idioms")
export class ChengyuNestController {
  constructor(@Inject(ChengyuService) private readonly service: ChengyuService) {}

  /**
   * GET /api/v1/chengyu/idioms
   * List idioms with optional `search` / `theme` / `era` filters and
   * `page` / `pageSize` pagination. All filters are optional and additive.
   */
  @Get()
  async list(@Query() query: Record<string, unknown>): Promise<unknown> {
    const search = typeof query.search === "string" ? query.search.trim() : undefined;
    const theme = query.theme !== undefined ? String(query.theme).trim() : undefined;
    const era = query.era !== undefined ? String(query.era).trim() : undefined;
    const page = query.page !== undefined ? Number(query.page) : undefined;
    const pageSize = query.pageSize !== undefined ? Number(query.pageSize) : undefined;

    try {
      return await this.service.listIdioms({ search, theme, era, page, pageSize });
    } catch (err) {
      if (err instanceof ChengyuValidationError) {
        throw new BadRequestException();
      }
      logger.error("Failed to load chengyu idioms", err);
      throw new InternalServerErrorException();
    }
  }

  /**
   * GET /api/v1/chengyu/idioms/:id
   * Get a single idiom by its `content_id` business key (`cy_XXXX`).
   */
  @Get(":id")
  async getById(@Param("id") id: string): Promise<unknown> {
    const idiomId = String(id);

    if (!idiomId || !CHENGYU_ID_REGEX.test(idiomId)) {
      throw new BadRequestException();
    }

    try {
      return await this.service.getIdiom(idiomId);
    } catch (err) {
      if (err instanceof ChengyuNotFoundError) {
        throw new NotFoundException();
      }
      logger.error(`Failed to load chengyu idiom ${idiomId}`, err);
      throw new InternalServerErrorException();
    }
  }
}
