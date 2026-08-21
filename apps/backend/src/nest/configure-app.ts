/**
 * @file apps/backend/src/nest/configure-app.ts
 * @description Shared NestJS shell app configuration (Story 24-2).
 *
 * Maps the Express `src/app/index.ts` middleware 1:1 onto a NestJS 11 app on
 * the Express platform adapter: `trust proxy 1`, the `/api` global prefix,
 * cookie parsing, the identical CORS allowlist, and graceful shutdown hooks.
 *
 * Extracted so the dev entry (`main.ts`) and the route-parity harness
 * (`tests/integration/nest/route-parity.test.ts`) configure the app through
 * the SAME code path — the harness therefore verifies the exact production
 * shell boot shape and the two can never drift.
 *
 * Deferred to later stories: requestId interceptor (24-3), error filter (24-3),
 * Swagger (24-15).
 */

import type { INestApplication } from "@nestjs/common";
import cookieParser from "cookie-parser";
import { config } from "../shared/config/index.js";

/** CORS — same explicit origin allowlist as app/index.ts. */
const allowedOrigins: string[] = [
  config.frontendUrl, // Production frontend (from FRONTEND_URL env var)
  "http://localhost:5173", // Local Vite dev server
  "http://localhost:5174", // Local Vite dev server (fallback port)
  "http://localhost:3000", // Alternative local port
];

/**
 * Apply the NestJS shell's shared middleware / routing configuration to an
 * app instance (mirroring the Express `app/index.ts` ordering).
 */
export function configureNestShellApp(app: INestApplication): void {
  // Trust Railway's proxy — required for the rate limiter to read the real
  // client IP from X-Forwarded-For. Railway edge proxy is always 1 hop away.
  app.getHttpAdapter().getInstance().set("trust proxy", 1);

  // Express mounts routes under /api — mirror with the global prefix.
  app.setGlobalPrefix("api");

  // Cookie parser for httpOnly cookie-based auth (parity now, harmless).
  app.use(cookieParser());

  // CORS — same explicit origin allowlist as app/index.ts (frontendUrl +
  // localhost:5173/5174/3000 + *.vercel.app + *.up.railway.app).
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow requests with no origin (mobile apps, Postman, server-to-server)
      if (!origin) {
        return callback(null, true);
      }

      // Check if origin is explicitly whitelisted
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow Vercel preview deployments (*.vercel.app)
      if (origin.endsWith(".vercel.app")) {
        return callback(null, true);
      }

      // Allow Railway preview deployments (*.up.railway.app)
      if (origin.endsWith(".up.railway.app")) {
        return callback(null, true);
      }

      // Reject all other origins
      callback(null, false);
    },
    credentials: true, // Required for cookie-based auth
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  // Graceful shutdown (Redis quit wiring lands in a later story).
  app.enableShutdownHooks();
}
