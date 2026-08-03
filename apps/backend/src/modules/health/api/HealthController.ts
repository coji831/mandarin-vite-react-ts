/**
 * @file apps/backend/src/modules/health/api/HealthController.js
 * @description Health check controller for system monitoring
 * Clean architecture: API layer - handles HTTP mapping only
 */

import { createLogger } from "../../../shared/utils/logger.js";
import type { Request, Response } from "express";

const logger = createLogger("HealthController");

/**
 * Base health check response with status and timestamp
 */
function createHealthResponse() {
  return {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
}

/**
 * HealthController class with dependency injection
 */
export class HealthController {
  private geminiService: { healthCheck(): Promise<boolean> };
  private audioService: { healthCheck(): Promise<boolean> };
  private redisClient: { ping(timeout?: number): Promise<string> };

  /**
   * @param geminiService - Gemini AI service
   * @param audioService - Audio (TTS) service
   * @param redisClient - Redis client instance
   */
  constructor(
    geminiService: { healthCheck(): Promise<boolean> },
    audioService: { healthCheck(): Promise<boolean> },
    redisClient: { ping(timeout?: number): Promise<string> },
  ) {
    this.geminiService = geminiService;
    this.audioService = audioService;
    this.redisClient = redisClient;
  }

  /**
   * Health check endpoint
   * GET /api/v1/health
   */
  async checkHealth(req: Request, res: Response) {
    try {
      const base = createHealthResponse();

      // Check external services
      const geminiOk = await this.geminiService.healthCheck().catch(() => false);
      const audioOk = await this.audioService.healthCheck().catch(() => false);

      // Check Redis connection
      let redisHealthy = false;
      try {
        await this.redisClient.ping(5000);
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
