// local-backend/middleware/asyncHandler.js
// Higher-order function to wrap async route handlers with error handling and logging

import { createLogger } from "../utils/logger.js";
import { validationError } from "../utils/errorFactory.js";

/**
 * Wraps async route handlers with consistent error handling, logging, and optional validation
 *
 * @param {Function} fn - Async handler function (req, res, next) => Promise
 * @param {Object} options - Configuration options
 * @param {string} options.logPrefix - Prefix for log messages (e.g., 'TTS')
 * @param {Function} options.validateSchema - Optional validation function (body) => { valid: boolean, error?: string }
 * @returns {Function} Express middleware function
 *
 * @example
 * router.post('/', asyncHandler(
 *   async (req, res) => {
 *     const result = await doSomething(req.body);
 *     res.json(result);
 *   },
 *   {
 *     logPrefix: 'MyController',
 *     validateSchema: (body) => ({
 *       valid: !!body.text,
 *       error: 'Text is required'
 *     })
 *   }
 * ));
 */
export function asyncHandler(fn, options = {}) {
  const { logPrefix = "Handler", validateSchema } = options;
  const logger = createLogger(logPrefix);

  return async (req, res, next) => {
    const startTime = Date.now();

    try {
      logger.requestReceived(req.method, req.path);

      // Optional schema validation
      if (validateSchema) {
        const validation = validateSchema(req.body);
        if (!validation.valid) {
          throw validationError(validation.error, { body: req.body });
        }
      }

      // Execute the handler
      await fn(req, res, next);

      // Log completion if response was sent
      if (res.headersSent) {
        const duration = Date.now() - startTime;
        logger.requestCompleted(duration);
      }
    } catch (error) {
      logger.error("Request failed", error);
      next(error);
    }
  };
}

export default asyncHandler;
