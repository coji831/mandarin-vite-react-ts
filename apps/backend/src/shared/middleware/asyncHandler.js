// apps/backend/src/shared/middleware/asyncHandler.js
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
  const { logPrefix, validateSchema } = options;
  const logger = logPrefix ? createLogger(logPrefix) : null;

  return async (req, res, next) => {
    try {
      // Optional request validation
      if (validateSchema && req.body) {
        const validation = validateSchema(req.body);
        if (!validation.valid) {
          throw validationError(validation.error || "Invalid request");
        }
      }

      // Execute the wrapped handler
      await fn(req, res, next);
    } catch (error) {
      // Log the error if we have a logger
      if (logger) {
        logger.error("Handler error", {
          message: error.message,
          code: error.code,
          statusCode: error.statusCode,
        });
      }

      // Pass to Express error handler
      next(error);
    }
  };
}

export default asyncHandler;
