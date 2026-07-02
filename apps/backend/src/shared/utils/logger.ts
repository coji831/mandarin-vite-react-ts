// apps/backend/src/shared/utils/logger.js
// Consistent logging utility with standardized formatting
// Pure decorator — zero imports, no side effects at module load time

/**
 * Logger class for consistent log formatting
 */
class Logger {
  private prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  /**
   * Log an informational message
   * @param msg - Message to log
   * @param args - Additional arguments
   */
  info(msg: string, ...args: unknown[]): void {
    console.log(`[${this.prefix}] ${msg}`, ...args);
  }

  /**
   * Log an error message
   * @param msg - Error message
   * @param error - Error object or additional context
   */
  error(msg: string, error: unknown): void {
    if (error instanceof Error) {
      console.error(`[${this.prefix} Error] ${msg}`, error.message, error.stack);
    } else {
      console.error(`[${this.prefix} Error] ${msg}`, error);
    }
  }

  /**
   * Log a cache hit
   * @param key - Cache key or path
   */
  cacheHit(key: string): void {
    console.log(`[${this.prefix}] Cache Hit: ${key}`);
  }

  /**
   * Log a cache miss
   * @param key - Cache key or path
   */
  cacheMiss(key: string): void {
    console.log(`[${this.prefix}] Cache Miss: ${key}`);
  }

  /**
   * Log a warning
   * @param msg - Warning message
   * @param args - Additional arguments
   */
  warn(msg: string, ...args: unknown[]): void {
    console.warn(`[${this.prefix} Warning] ${msg}`, ...args);
  }

  /**
   * Log a debug message
   * @param msg - Debug message
   * @param args - Additional arguments
   */
  debug(msg: string, ...args: unknown[]): void {
    console.log(`[${this.prefix} Debug] ${msg}`, ...args);
  }

  /**
   * Log request received
   * @param method - HTTP method
   * @param path - Request path
   */
  requestReceived(method: string, path: string): void {
    console.log(`[${this.prefix}] Request received: ${method} ${path}`);
  }

  /**
   * Log request completed with duration
   */
  requestCompleted(method: string, path: string, durationMs: number): void {
    console.log(`[${this.prefix}] Request completed: ${method} ${path} (${durationMs}ms)`);
  }
}

/**
 * Create a logger instance with the given prefix
 * @param prefix - Prefix for log messages
 * @returns Logger instance
 */
export function createLogger(prefix: string): Logger {
  return new Logger(prefix);
}

export default { createLogger };
