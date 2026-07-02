// apps/backend/src/shared/middleware/asyncHandler.ts
// Higher-order function to wrap async route handlers with error handling and logging

import { createLogger } from "../utils/logger.js";
import { validationError } from "../utils/errorFactory.js";
import type { Request, Response, NextFunction } from "express";

interface AsyncHandlerOptions {
  logPrefix?: string;
  validateSchema?: (body: any) => { valid: boolean; error?: string };
}

/**
 * Wraps async route handlers with consistent error handling, logging, and optional validation
 *
 * @param fn - Async handler function (req, res, next) => Promise
 * @param options - Configuration options
 * @param options.logPrefix - Prefix for log messages (e.g., 'TTS')
 * @param options.validateSchema - Optional validation function (body) => { valid: boolean, error?: string }
 * @returns Express middleware function
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
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
  options: AsyncHandlerOptions = {},
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
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
        const err = error as any;
        logger.error("Handler error", {
          message: err.message,
          code: err.code,
          statusCode: err.statusCode,
        });
      }

      // Pass to Express error handler
      next(error);
    }
  };
}

export default asyncHandler;
