/**
 * Cache Metrics Tracker
 * Simple in-memory cache hit/miss counter with periodic logging.
 * Tracks cache performance for monitoring and optimization.
 */

class CacheMetrics {
  constructor() {
    this.hits = 0;
    this.misses = 0;
    this.totalRequests = 0;
    this.logInterval = 50; // Log every 50 requests
  }

  /**
   * Record a cache hit or miss
   * @param {'hit'|'miss'} type - Type of cache event
   */
  record(type) {
    this.totalRequests++;

    if (type === "hit") {
      this.hits++;
    } else if (type === "miss") {
      this.misses++;
    }

    // Log metrics every N requests
    if (this.totalRequests % this.logInterval === 0) {
      this.logMetrics();
    }
  }

  /**
   * Calculate cache hit rate percentage
   * @returns {number} Hit rate as percentage (0-100)
   */
  getHitRate() {
    if (this.totalRequests === 0) return 0;
    return Math.round((this.hits / this.totalRequests) * 100);
  }

  /**
   * Log current cache metrics
   */
  logMetrics() {
    const hitRate = this.getHitRate();
    console.log(
      `[CacheMetrics] Hit rate: ${hitRate}% (${this.hits} hits, ${this.misses} misses, ${this.totalRequests} total requests)`,
    );
  }

  /**
   * Get current metrics snapshot
   * @returns {Object} Current metrics
   */
  getSnapshot() {
    return {
      hits: this.hits,
      misses: this.misses,
      totalRequests: this.totalRequests,
      hitRate: this.getHitRate(),
    };
  }

  /**
   * Reset all counters
   */
  reset() {
    this.hits = 0;
    this.misses = 0;
    this.totalRequests = 0;
  }
}

// Export singleton instance
export const cacheMetrics = new CacheMetrics();
