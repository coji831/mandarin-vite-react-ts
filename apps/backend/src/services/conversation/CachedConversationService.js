// apps/backend/src/services/conversation/CachedConversationService.js
// Conversation service wrapper with Redis caching layer

import { createLogger } from "../../utils/logger.js";
import { computeHash } from "../../utils/hashUtils.js";
import { cacheConfig } from "../../config/redis.js";

const logger = createLogger("CachedConversationService");

/**
 * Cached Conversation service that wraps the base conversation service with Redis caching
 * Cache keys are generated using SHA256 hash of wordId + prompt (or just wordId for backward compatibility)
 * TTL: 1 hour (configurable via CACHE_TTL_CONVERSATION)
 */
export class CachedConversationService {
  /**
   * @param {Object} conversationService - Base conversation service (with generateConversationText method)
   * @param {import('../cache/CacheService.js').CacheService} cacheService - Cache service instance
   */
  constructor(conversationService, cacheService) {
    this.conversationService = conversationService;
    this.cacheService = cacheService;
    this.metrics = {
      hits: 0,
      misses: 0,
    };
    logger.info("Initialized with cache");
  }

  /**
   * Generate cache key for conversation request
   * Format: conv:{wordId}:{hash} where hash = SHA256(wordId)
   * Note: Currently only uses wordId for backward compatibility with existing cache
   * @param {string} wordId - Word identifier
   * @param {string} prompt - Optional prompt (for future use)
   * @returns {string} Cache key
   */
  generateCacheKey(wordId, prompt = "") {
    // For now, only hash wordId for backward compatibility
    // In future, could include prompt: const hash = computeHash(`${wordId}${prompt}`);
    const hash = computeHash(wordId);
    return `conv:${wordId}:${hash}`;
  }

  /**
   * Generate conversation text with caching
   * @param {string} wordId - Vocabulary word ID
   * @param {string} word - The word itself
   * @param {Object} options - Options (generatorVersion, etc.)
   * @returns {Promise<Object>} Conversation object with turns
   */
  async generateConversationText(wordId, word, options = {}) {
    const generatorVersion = options.generatorVersion || "v1";
    const cacheKey = this.generateCacheKey(wordId);

    try {
      // Try cache first
      const cached = await this.cacheService.get(cacheKey);
      if (cached !== null) {
        this.metrics.hits++;
        logger.cacheHit(cacheKey);
        return JSON.parse(cached);
      }

      // Cache miss - call actual conversation service
      this.metrics.misses++;
      logger.cacheMiss(cacheKey);

      const conversation = await this.conversationService.generateConversationText(
        wordId,
        word,
        generatorVersion
      );

      // Store in cache (serialize to JSON string)
      const serialized = JSON.stringify(conversation);
      await this.cacheService.set(cacheKey, serialized, cacheConfig.ttl.conversation);

      logger.info(`Generated and cached conversation: ${cacheKey}`);
      return conversation;
    } catch (error) {
      logger.error("Conversation generation failed", error);
      throw error;
    }
  }

  /**
   * Generate turn audio - delegates to underlying service (audio not cached in Redis)
   * @param {string} wordId - Word identifier
   * @param {number} turnIndex - Turn index
   * @param {string} text - Text to synthesize
   * @param {string} voice - Voice name
   * @returns {Promise<Object>} Audio metadata
   */
  async generateTurnAudio(wordId, turnIndex, text, voice) {
    return this.conversationService.generateTurnAudio(wordId, turnIndex, text, voice);
  }

  /**
   * Clear cache for a specific word
   * @param {string} wordId - Word identifier to clear cache for
   * @returns {Promise<number>} Number of keys cleared
   */
  async clearCache(wordId) {
    const pattern = `conv:${wordId}:*`;
    const deletedCount = await this.cacheService.clear(pattern);
    logger.info(`Cleared ${deletedCount} cache entries for wordId: ${wordId}`);
    return deletedCount;
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
}
