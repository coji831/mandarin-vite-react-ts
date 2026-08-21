/**
 * @file apps/backend/src/shared/types/express.d.ts
 * @description Express type augmentation for request-scoped auth/tracing fields.
 *
 * Story 24-15 (cutover): the `req.xController` / `req.geminiService`
 * augmentations (injected by the deleted Express `app/routes.ts` middleware)
 * are removed — the Express surface is gone and the Nest shell injects
 * controllers via Nest DI. The `userId` / `user` / `requestId` fields are
 * KEPT: the Nest guards (`src/nest/guards/*`) attach them and the Nest
 * controllers + rate-limit config read them on the Express adapter.
 */

declare global {
  namespace Express {
    interface Request {
      /** User ID set by auth middleware / Nest auth guards after JWT verification */
      userId?: string;

      /** Decoded JWT payload set by auth middleware / Nest auth guards */
      user?: { userId: string; email?: string } & Record<string, unknown>;

      /** Request ID for tracing, set by requestIdMiddleware */
      requestId?: string;
    }
  }
}

export {};
