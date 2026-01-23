/**
 * @file apps/backend/src/api/controllers/healthController.js
 * @description Health check controller for system monitoring
 * Clean architecture: API layer - handles HTTP mapping only
 */

import { createHealthResponse } from "../../utils/conversationUtils.js";
import { createLogger } from "../../utils/logger.js";

const logger = createLogger("HealthController");

/**
 * HealthController class with dependency injection
 */
export class HealthController {
  /**
   * @param {Object} geminiService - Gemini AI service
   * @param {Object} ttsService - Text-to-speech service
   * @param {Object} redisClient - Redis client instance
   * @param {Function} getCacheMetrics - Function to get cache metrics
   */
  constructor(geminiService, ttsService, redisClient, getCacheMetrics) {
    this.geminiService = geminiService;
    this.ttsService = ttsService;
    this.redisClient = redisClient;
    this.getCacheMetrics = getCacheMetrics;
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
          metrics: this.getCacheMetrics(),
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
