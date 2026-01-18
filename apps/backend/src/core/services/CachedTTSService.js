// apps/backend/src/core/services/CachedTTSService.js
// TTS service wrapper with Redis caching layer

import { createLogger } from "../../utils/logger.js";
import { computeHash } from "../../utils/hashUtils.js";
import { cacheConfig } from "../../config/redis.js";

const logger = createLogger("CachedTTSService");

/**
 * Cached TTS service that wraps the base TTS service with Redis caching
 * Cache keys are generated using SHA256 hash of text + voice
 * TTL: 24 hours (configurable via CACHE_TTL_TTS)
 */
export class CachedTTSService {
  /**
   * @param {Object} ttsService - Base TTS service (with synthesizeSpeech method)
   * @param {import('../../infrastructure/cache/CacheService.js').CacheService} cacheService - Cache service instance
   */
  constructor(ttsService, cacheService) {
    this.ttsService = ttsService;
    this.cacheService = cacheService;
    this.metrics = {
      hits: 0,
      misses: 0,
    };
    logger.info("Initialized with cache");
  }

  /**
   * Generate cache key for TTS request
   * Format: tts:{hash} where hash = SHA256(text + voice)
   * @param {string} text - Text to synthesize
   * @param {string} voice - Voice name
   * @returns {string} Cache key
   */
  generateCacheKey(text, voice = "") {
    const hash = computeHash(`${text}${voice}`);
    return `tts:${hash}`;
  }

  /**
   * Synthesize speech with caching
   * @param {string} text - Text to synthesize
   * @param {Object} options - TTS options (voice, languageCode, audioEncoding)
   * @returns {Promise<Buffer>} Audio content
   */
  async synthesizeSpeech(text, options = {}) {
    const voice = options.voice || "";
    const cacheKey = this.generateCacheKey(text, voice);

    try {
      // Try cache first
      const cached = await this.cacheService.get(cacheKey);
      if (cached !== null) {
        this.metrics.hits++;
        logger.cacheHit(cacheKey);
        // Convert base64 string back to Buffer
        return Buffer.from(cached, "base64");
      }

      // Cache miss - call actual TTS service
      this.metrics.misses++;
      logger.cacheMiss(cacheKey);

      const audioContent = await this.ttsService.synthesizeSpeech(text, options);

      // Store in cache (convert Buffer to base64 string)
      const base64Audio = audioContent.toString("base64");
      await this.cacheService.set(cacheKey, base64Audio, cacheConfig.ttl.tts);

      logger.info(`Generated and cached TTS: ${cacheKey.substring(0, 20)}...`);
      return audioContent;
    } catch (error) {
      logger.error("TTS synthesis failed", error);
      throw error;
    }
  }

  /**
   * Get cache metrics (hits and misses)
   * @returns {Object} Metrics object with hits, misses, and hit rate
   */
  getMetrics() {
    const total = this.metrics.hits + this.metrics.misses;
    const hitRate = total > 0 ? (this.metrics.hits / total) * 100 : 0;
    return {
      hits: this.metrics.hits,
      misses: this.metrics.misses,
      total,
      hitRate: hitRate.toFixed(2),
    };
  }

  /**
   * Health check - delegates to underlying TTS service
   * @returns {Promise<boolean>}
   */
  async healthCheck() {
    if (typeof this.ttsService.healthCheck === "function") {
      return this.ttsService.healthCheck();
    }
    return true;
  }
}
