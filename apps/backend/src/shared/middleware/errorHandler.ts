/**
 * @file apps/backend/src/shared/middleware/errorHandler.ts
 * @description Request-ID middleware (shared with the Nest shell).
 *
 * Story 24-15 (cutover): the Express `errorHandler` middleware is removed —
 * the Express surface is gone and the Nest `AppExceptionFilter` reproduces
 * the envelope byte-for-byte (`src/nest/exception.filter.ts`).
 */

import { v4 as uuidv4 } from "uuid";
import type { Request, Response, NextFunction } from "express";

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  req.requestId = (req.headers["x-request-id"] as string) || uuidv4();
  res.setHeader("X-Request-Id", req.requestId);
  next();
}
