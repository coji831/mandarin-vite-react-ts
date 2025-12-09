class Logger {
  constructor(prefix) {
    this.prefix = prefix;
  }
  info(msg, ...args) {
    console.log(`[${this.prefix}] ${msg}`, ...args);
  }
  error(msg, error) {
    if (error instanceof Error) {
      console.error(`[${this.prefix} Error] ${msg}`, error.message, error.stack);
    } else {
      console.error(`[${this.prefix} Error] ${msg}`, error);
    }
  }
  cacheHit(key) {
    console.log(`[${this.prefix}] Cache Hit: ${key}`);
  }
  cacheMiss(key) {
    console.log(`[${this.prefix}] Cache Miss: ${key}`);
  }
  warn(msg, ...args) {
    console.warn(`[${this.prefix} Warning] ${msg}`, ...args);
  }
  debug(msg, ...args) {
    if (process.env.ENABLE_DETAILED_LOGS === "true") {
      console.log(`[${this.prefix} Debug] ${msg}`, ...args);
    }
  }
  requestReceived(method, path) {
    console.log(`[${this.prefix}] Request received: ${method} ${path}`);
  }
  requestCompleted(durationMs) {
    console.log(`[${this.prefix}] Completed in ${durationMs}ms`);
  }
}
export function createLogger(prefix) {
  return new Logger(prefix);
}
export default createLogger;
