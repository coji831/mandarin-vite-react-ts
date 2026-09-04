/**
 * @file apps/backend/src/shared/types/express.d.ts
 * @description Express type augmentation for request-scoped auth/tracing
 * fields. `userId` / `user` / `requestId` are attached by the Nest guards
 * (`src/nest/guards/*`) and read by the Nest controllers + rate-limit config
 * on the Express adapter.
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
