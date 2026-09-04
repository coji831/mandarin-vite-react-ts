/**
 * @file apps/backend/src/modules/health/nest/health-nest.controller.ts
 * @description NestJS controller for the health check (Story 24-10 — Audio +
 * Health Port).
 *
 * `GET /v1/health` returns the SAME 200 shape: `{ status, timestamp, uptime,
 * services: { gemini, tts }, cache: { redis: { connected } } }`, and the same
 * 500 shape `{ error, code, message }` (`HEALTH_CHECK_FAILED`) if the response
 * assembly itself throws.
 *
 * Full `@Res()` mirror (like the radicals `200 null` port): the success body
 * is written with `res.status(200).json(...)` and the catch branch writes the
 * `{ error, code, message }` shape directly — Nest's exception filter would
 * otherwise re-wrap it into the `{ code, message, requestId }` envelope, which
 * is NOT what the health endpoint emits.
 *
 * ## The `AudioServiceLike` cross-module import (resolved via Nest DI)
 * `HealthModule` imports `AudioModule` and the controller injects the exported
 * `AudioService` (which implements `AudioServiceLike`) via `@Inject(AudioService)`
 * — module-to-module Nest DI. The constructor param is typed structurally
 * (`{ healthCheck(): Promise<boolean> }`) so no `modules/audio` barrel is ever
 * imported from health Nest land.
 *
 * Redis health: the raw ioredis client is read via `redisClient.getClient()`
 * (fallback ping resolving "NO_REDIS" when no client is configured), and
 * `connected: true` iff `ping(5000)` resolves without throwing — byte-for-byte
 * the health check logic.
 */

import { Controller, Get, Inject, Res } from "@nestjs/common";
import type { Response } from "express";
import { createLogger } from "../../../shared/utils/logger.js";
import { GeminiService } from "../../../shared/infrastructure/external/GeminiService.js";
import { AudioService } from "../../audio/services/AudioService.js";
import { RedisClient } from "../../../shared/infrastructure/redis/RedisClient.js";

const logger = createLogger("HealthNestController");

/** Base health check response with status and timestamp (mirrors Express). */
function createHealthResponse(): {
  status: string;
  timestamp: string;
  uptime: number;
} {
  return {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
}

/** Minimal structural audio contract — same as the Express HealthController ctor. */
interface AudioHealthLike {
  healthCheck(): Promise<boolean>;
}

/**
 * NestJS controller for the health check endpoint (Story 24-10).
 */
@Controller("v1/health")
export class HealthNestController {
  /**
   * @param geminiService - Gemini AI service (healthCheck only)
   * @param audioService - Audio (TTS) service via Nest DI from AudioModule
   * @param redisClient - Redis client singleton (raw client ping interface)
   */
  constructor(
    @Inject(GeminiService) private readonly geminiService: { healthCheck(): Promise<boolean> },
    @Inject(AudioService) private readonly audioService: AudioHealthLike,
    @Inject(RedisClient) private readonly redisClient: RedisClient,
  ) {}

  /**
   * GET /v1/health
   * System health check — mirrors the Express HealthController.checkHealth
   * byte-for-byte (status, uptime, external-service health, Redis ping).
   */
  @Get()
  async checkHealth(@Res() res: Response): Promise<void> {
    try {
      const base = createHealthResponse();

      // Check external services (each degrades to false on failure).
      const geminiOk = await this.geminiService.healthCheck().catch(() => false);
      const audioOk = await this.audioService.healthCheck().catch(() => false);

      // Redis connection check — same raw-client ping wiring as the Express
      // health container: `getClient()` or a fallback ping resolving "NO_REDIS"
      // (which counts as healthy, exactly like Express).
      const rawClient = this.redisClient.getClient();
      const redisPing = (rawClient ?? { ping: async () => "NO_REDIS" }) as {
        ping(timeout?: number): Promise<string>;
      };

      let redisHealthy = false;
      try {
        await redisPing.ping(5000);
        redisHealthy = true;
      } catch (error) {
        logger.warn("Redis health check failed", {
          error: error instanceof Error ? error.message : String(error),
        });
        redisHealthy = false;
      }

      res.status(200).json({
        ...base,
        services: {
          gemini: geminiOk,
          tts: audioOk,
        },
        cache: {
          redis: { connected: redisHealthy },
        },
      });
    } catch (error) {
      logger.error("Health check failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({
        error: "Internal Server Error",
        code: "HEALTH_CHECK_FAILED",
        message: "Failed to perform health check",
      });
    }
  }
}
