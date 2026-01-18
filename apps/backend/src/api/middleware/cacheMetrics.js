// apps/backend/src/middleware/cacheMetrics.js
// Cache metrics collection and aggregation

/**
 * Global cache metrics registry
 * Maps service names to their metric objects
 */
const metricsRegistry = new Map();

/**
 * Register a cache service for metrics tracking
 * @param {string} serviceName - Name of the service (e.g., "TTS", "Conversation")
 * @param {Function} getMetricsFn - Function to call to get current metrics
 */
export function registerCacheMetrics(serviceName, getMetricsFn) {
  metricsRegistry.set(serviceName, getMetricsFn);
}

/**
 * Collect and aggregate cache metrics from all registered services
 * @returns {Object} Aggregated cache metrics
 */
export function getCacheMetrics() {
  const aggregated = {
    services: {},
    overall: {
      hits: 0,
      misses: 0,
      total: 0,
      hitRate: "0.00",
    },
  };

  // Collect metrics from each registered service
  for (const [serviceName, getMetricsFn] of metricsRegistry.entries()) {
    try {
      const metrics = getMetricsFn();
      aggregated.services[serviceName] = metrics;
      aggregated.overall.hits += metrics.hits || 0;
      aggregated.overall.misses += metrics.misses || 0;
      aggregated.overall.total += metrics.total || 0;
    } catch (error) {
      // If a service fails to provide metrics, skip it
      aggregated.services[serviceName] = { error: "Failed to fetch metrics" };
    }
  }

  // Calculate overall hit rate
  if (aggregated.overall.total > 0) {
    const hitRate = (aggregated.overall.hits / aggregated.overall.total) * 100;
    aggregated.overall.hitRate = hitRate.toFixed(2);
  }

  return aggregated;
}

/**
 * Reset all metrics (optional, for testing or periodic reset)
 */
export function resetCacheMetrics() {
  metricsRegistry.clear();
}
