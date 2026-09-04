/**
 * @file apps/backend/src/nest/request-id.middleware.ts
 * @description RequestId middleware for the Nest shell (Story 24-3 —
 * HTTP-Layer Parity).
 *
 * Re-exports the production Express `requestIdMiddleware` from
 * `src/shared/middleware/errorHandler.ts` — `req.requestId =
 * req.headers["x-request-id"] || uuidv4()` + `X-Request-Id` response header.
 *
 * Re-exporting (rather than re-implementing) guarantees byte-for-byte parity:
 * the Nest shell mounts the exact same function the Express app uses today,
 * so `requestId` format and header behavior can never drift.
 */

export { requestIdMiddleware } from "../shared/middleware/errorHandler.js";
