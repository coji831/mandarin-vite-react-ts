/**
 * @file apps/backend/src/nest/exception.filter.ts
 * @description Global NestJS exception filter reproducing the Express
 * `errorHandler.ts` envelope byte-for-byte (Story 24-3 — HTTP-Layer Parity).
 *
 * Every 4xx/5xx from the Nest shell is serialized as `{ code, message,
 * requestId }` with the same status mapping as `src/shared/middleware/
 * errorHandler.ts` (`err.status || err.statusCode || 500`) and the same log
 * call (`logger.error("API Error", { requestId, code, message, stack })`) so
 * the O1 error-visibility parity AC is satisfied on the migrated surface.
 *
 * Nest's `HttpException` is mapped into the Express error-like shape:
 *   - status  ← `HttpException.getStatus()`
 *   - message ← `getResponse()` (string) or `getResponse().message`
 *   - code    ← `getResponse().code` (absent for bare `BadRequestException()`)
 *
 * The pure `resolveHttpError()`/`logError()` helpers are shared with the
 * Express error bridge (`mountExpressErrorBridge`) so pre-router middleware
 * errors (body-parser 413, cookie-parser) emit the exact same envelope with
 * zero drift — the two paths can never diverge.
 */

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  type INestApplication,
} from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import express from "express";
import { v4 as uuidv4 } from "uuid";
import { createLogger } from "../shared/utils/logger.js";

/** Error-like shape the Express `errorHandler` understands. */
export interface ErrorLike {
  code?: string;
  message?: string;
  status?: number;
  statusCode?: number;
  stack?: string;
}

/** Serialized error envelope — byte-for-byte `errorHandler.ts` output. */
export interface ErrorEnvelope {
  code: string;
  message: string;
  requestId: string;
}

/** Map a Nest `HttpException` into the Express `ErrorLike` shape. */
function fromHttpException(exception: HttpException): ErrorLike {
  const status = exception.getStatus();
  const response = exception.getResponse();

  let message: string | undefined;
  let code: string | undefined;

  if (typeof response === "string") {
    message = response;
  } else if (response && typeof response === "object") {
    const body = response as { message?: string | string[]; code?: string };
    message = Array.isArray(body.message) ? body.message.join(", ") : body.message;
    code = body.code;
  }

  return { status, statusCode: status, message, code, stack: exception.stack };
}

/**
 * Pure mapping shared by the Nest filter AND the Express error bridge —
 * identical to `errorHandler.ts`: status `err.status || err.statusCode || 500`,
 * envelope `{ code: err.code || "INTERNAL_ERROR", message: err.message ||
 * "An unexpected error occurred", requestId }`.
 */
export function resolveHttpError(
  err: ErrorLike,
  requestId: string,
): { status: number; envelope: ErrorEnvelope } {
  return {
    status: err.status || err.statusCode || 500,
    envelope: {
      code: err.code || "INTERNAL_ERROR",
      message: err.message || "An unexpected error occurred",
      requestId,
    },
  };
}

/** Log an error identically to `errorHandler.ts` (O1 error-visibility parity). */
export function logError(
  logger: ReturnType<typeof createLogger>,
  err: ErrorLike,
  envelope: ErrorEnvelope,
): void {
  logger.error("API Error", {
    requestId: envelope.requestId,
    code: envelope.code,
    message: envelope.message,
    stack: err.stack,
  });
}

/**
 * Global `@Catch()` filter — reproduces `errorHandler.ts` byte-for-byte for
 * every 4xx/5xx on the Nest shell. Registered via `APP_FILTER` in AppModule.
 */
@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  private readonly logger = createLogger("NestExceptionFilter");

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    let err: ErrorLike = {};
    if (exception instanceof HttpException) {
      err = fromHttpException(exception);
    } else if (exception instanceof Error) {
      err = exception as ErrorLike;
    }

    const requestId = req.requestId || uuidv4();
    const { status, envelope } = resolveHttpError(err, requestId);
    logError(this.logger, err, envelope);

    res.status(status).json(envelope);
  }
}

const bridgeLogger = createLogger("NestExceptionFilter");

/** Express error-handling middleware mounted LAST on the Nest adapter. */
function expressErrorBridge(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const errorLike = (err instanceof Error ? err : {}) as ErrorLike;
  const requestId = req.requestId || uuidv4();
  const { status, envelope } = resolveHttpError(errorLike, requestId);
  logError(bridgeLogger, errorLike, envelope);

  res.status(status).json(envelope);
}

/**
 * Mount the Express error-handling bridge on the Nest Express adapter — LAST,
 * after every other `app.use(...)` mount. It catches errors from pre-router
 * middleware (body-parser 413, cookie-parser) that Nest's exception filter
 * cannot see (those errors bypass the Nest router entirely), emitting the
 * identical `{ code, message, requestId }` envelope via the shared mapper.
 *
 * MUST be called after `configureNestShellApp()` and after any test-only
 * middleware mounts (so it sits after them in the middleware chain).
 */
export function mountExpressErrorBridge(app: INestApplication): void {
  const expressApp = app.getHttpAdapter().getInstance() as express.Express;
  expressApp.use(expressErrorBridge);
}
