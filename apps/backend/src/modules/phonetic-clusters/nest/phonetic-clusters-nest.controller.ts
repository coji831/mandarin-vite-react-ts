/**
 * @file apps/backend/src/modules/phonetic-clusters/nest/phonetic-clusters-nest.controller.ts
 * @description NestJS controller for the Phonetic Clusters module (Story 24-2 shell).
 *
 * Mirrors `api/PhoneticClustersController.ts` (Express) 1:1 — same validation
 * regexes, same service delegation, same 2xx JSON. Bypasses the
 * `req.phoneticClustersController` pattern; throws `BadRequestException` /
 * `NotFoundException` on 4xx (envelope parity deferred to 24-3).
 *
 * Route patterns copied verbatim from `api/phoneticClustersRoutes.ts`
 * (`ROUTE_PATTERNS.phoneticClusters` + `phoneticClustersById(":id")`).
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
import { PhoneticClustersService } from "../services/PhoneticClustersService.js";
import { PhoneticClusterNotFoundError } from "../types/phonetic-clusters-errors.js";

// ── Constants ──────────────────────────────────────────────────────────────

/** Regular expression to match a numeric HSK level (1-6). */
const HSK_LEVEL_REGEX = /^[1-6]$/;

/** Regular expression to match a PhoneticCluster ID format (pc_NNNN). */
const PC_ID_REGEX = /^pc_\d+$/;

const logger = createLogger("PhoneticClustersNestController");

/**
 * NestJS controller for phonetic cluster operations (Story 24-2 shell).
 */
@Controller("v1/phonetic-clusters")
export class PhoneticClustersNestController {
  constructor(@Inject(PhoneticClustersService) private readonly service: PhoneticClustersService) {}

  /**
   * GET /api/v1/phonetic-clusters
   * List all phonetic clusters, optionally filtered by HSK level.
   */
  @Get()
  async list(@Query() query: Record<string, unknown>): Promise<{ data: unknown }> {
    let hskLevel: number | undefined;

    if (query.hskLevel !== undefined) {
      const parsed = Number(query.hskLevel);
      if (!HSK_LEVEL_REGEX.test(String(query.hskLevel))) {
        throw new BadRequestException();
      }
      hskLevel = parsed;
    }

    const result = await this.service.listClusters(hskLevel);
    return { data: result };
  }

  /**
   * GET /api/v1/phonetic-clusters/:id
   * Get a single phonetic cluster by ID.
   */
  @Get(":id")
  async getById(@Param("id") id: string): Promise<{ data: unknown }> {
    const clusterId = String(id);

    if (!clusterId || !PC_ID_REGEX.test(clusterId)) {
      throw new BadRequestException();
    }

    try {
      const result = await this.service.getCluster(clusterId);
      return { data: result };
    } catch (err) {
      if (err instanceof PhoneticClusterNotFoundError) {
        throw new NotFoundException();
      }
      logger.error(`Failed to load phonetic cluster ${clusterId}`, err);
      throw new InternalServerErrorException();
    }
  }
}
