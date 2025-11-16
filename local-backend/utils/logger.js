// local-backend/utils/logger.js
// Consistent logging utility with standardized formatting

/**
 * Logger class for consistent log formatting
 */
class Logger {
  constructor(prefix) {
    this.prefix = prefix;
  }

  /**
   * Log an informational message
   * @param {string} msg - Message to log
   * @param {...any} args - Additional arguments
   */
  info(msg, ...args) {
    console.log(`[${this.prefix}] ${msg}`, ...args);
  }

  /**
   * Log an error message
   * @param {string} msg - Error message
   * @param {Error|any} error - Error object or additional context
   */
  error(msg, error) {
    if (error instanceof Error) {
      console.error(`[${this.prefix} Error] ${msg}`, error.message, error.stack);
    } else {
      console.error(`[${this.prefix} Error] ${msg}`, error);
    }
  }

  /**
   * Log a cache hit
   * @param {string} key - Cache key or path
   */
  cacheHit(key) {
    console.log(`[${this.prefix}] Cache Hit: ${key}`);
  }

  /**
   * Log a cache miss
   * @param {string} key - Cache key or path
   */
  cacheMiss(key) {
    console.log(`[${this.prefix}] Cache Miss: ${key}`);
  }

  /**
   * Log a warning
   * @param {string} msg - Warning message
   * @param {...any} args - Additional arguments
   */
  warn(msg, ...args) {
    console.warn(`[${this.prefix} Warning] ${msg}`, ...args);
  }

  /**
   * Log a debug message (only if detailed logs enabled)
   * @param {string} msg - Debug message
   * @param {...any} args - Additional arguments
   */
  debug(msg, ...args) {
    if (process.env.ENABLE_DETAILED_LOGS === "true") {
      console.log(`[${this.prefix} Debug] ${msg}`, ...args);
    }
  }

  /**
   * Log request received
   * @param {string} method - HTTP method
   * @param {string} path - Request path
   */
  requestReceived(method, path) {
    console.log(`[${this.prefix}] Request received: ${method} ${path}`);
  }

  /**
   * Log request completed with duration
   * @param {number} durationMs - Request duration in milliseconds
   */
  requestCompleted(durationMs) {
    console.log(`[${this.prefix}] Completed in ${durationMs}ms`);
  }
}

/**
 * Create a logger instance with the given prefix
 * @param {string} prefix - Logger prefix (e.g., 'TTS', 'Conversation')
 * @returns {Logger} Logger instance
 */
export function createLogger(prefix) {
  return new Logger(prefix);
}

export default createLogger;
