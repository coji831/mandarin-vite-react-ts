/**
 * @file apps/backend/src/modules/health/api/HealthController.js
 * @description Health check controller for system monitoring
 * Clean architecture: API layer - handles HTTP mapping only
 */

import { createLogger } from "../../../shared/utils/logger.js";

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
  /**
   * @param {Object} geminiService - Gemini AI service
   * @param {Object} ttsService - Text-to-speech service
   * @param {Object} redisClient - Redis client instance
   */
  constructor(geminiService, ttsService, redisClient) {
    this.geminiService = geminiService;
    this.ttsService = ttsService;
    this.redisClient = redisClient;
  }

  /**
   * Health check endpoint
   * GET /api/v1/health
   */
  async checkHealth(req, res) {
    try {
      const base = createHealthResponse();

      // Check external services
      const geminiOk = await this.geminiService.healthCheck().catch(() => false);
      const ttsOk = await this.ttsService.healthCheck().catch(() => false);

      // Check Redis connection
      let redisHealthy = false;
      try {
        await this.redisClient.ping(5000);
        redisHealthy = true;
      } catch (error) {
        logger.warn("Redis health check failed", { error: error.message });
        redisHealthy = false;
      }

      res.status(200).json({
        ...base,
        services: {
          gemini: geminiOk,
          tts: ttsOk,
        },
        cache: {
          redis: { connected: redisHealthy },
        },
      });
    } catch (error) {
      logger.error("Health check failed", { error: error.message });
      res.status(500).json({
        error: "Internal Server Error",
        code: "HEALTH_CHECK_FAILED",
        message: "Failed to perform health check",
      });
    }
  }
}
