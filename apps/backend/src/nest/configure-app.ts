/**
 * @file apps/backend/src/nest/configure-app.ts
 * @description Shared NestJS shell app configuration (Story 24-2 + 24-3).
 *
 * Maps the Express `src/app/index.ts` middleware 1:1 onto a NestJS 11 app on
 * the Express platform adapter: `trust proxy 1`, the `/api` global prefix,
 * the identical CORS allowlist, body parsers, cookie parsing, the requestId
 * middleware, per-route rate limiting, and graceful shutdown hooks.
 *
 * Extracted so the dev entry (`main.ts`) and the route-parity harness
 * (`tests/integration/nest/route-parity.test.ts`) configure the app through
 * the SAME code path — the harness therefore verifies the exact production
 * shell boot shape and the two can never drift.
 *
 * Story 24-3 (HTTP-Layer Parity): mounts `express.json()` +
 * `express.urlencoded({ extended: true })` with the SAME options/limits as
 * `app/index.ts` (Nest's built-in parser is disabled via `bodyParser: false`
 * at `NestFactory.create` so ours is authoritative), the requestId middleware
 * (`X-Request-Id` header + `req.requestId`), and the `words` per-route rate
 * limiters (the only ported routes with a limiter today). The global
 * `ExceptionFilter` + the Express error bridge are wired separately
 * (`AppModule` / `mountExpressErrorBridge`).
 *
 * Deferred to later stories: Swagger (24-15).
 */

import type { INestApplication } from "@nestjs/common";
import cookieParser from "cookie-parser";
import express, { type Express } from "express";
import { config } from "../shared/config/index.js";
import { requestIdMiddleware } from "./request-id.middleware.js";
import {
  rateLimitAuth,
  rateLimitMnemonics,
  rateLimitQuizFeedback,
  rateLimitReadersByAuth,
  rateLimitWordsByAuth,
} from "./rate-limit.config.js";

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

  // CORS — same explicit origin allowlist as app/index.ts (frontendUrl +
  // localhost:5173/5174/3000 + *.vercel.app + *.up.railway.app). CORS is
  // mounted before the body parsers so error responses also carry CORS headers
  // (parity with app/index.ts ordering).
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

  // Body parsers after CORS so error responses always include CORS headers —
  // identical options/limits to app/index.ts (express.json() +
  // express.urlencoded({ extended: true })). Nest's built-in parser is
  // disabled (`bodyParser: false` at NestFactory.create) so this is the single
  // authoritative body-parser config; oversized bodies fail with the identical
  // 413 + envelope (see route-parity harness).
  const expressApp = app.getHttpAdapter().getInstance() as Express;
  expressApp.use(express.json());
  expressApp.use(express.urlencoded({ extended: true }));

  // Cookie parser for httpOnly cookie-based auth (parity now, harmless).
  app.use(cookieParser());

  // Request ID middleware — req.requestId + X-Request-Id response header
  // (parity with requestIdMiddleware in shared/middleware/errorHandler.ts).
  app.use(requestIdMiddleware);

  // Rate-limit parity — `words` is mounted path-scoped (WordsRoutes.ts: 60/min
  // user, 20/min guest), `auth` mounts the shared brute-force limiter on
  // `/register` + `/login` (authRoutes.ts: 5/min per IP), and `mnemonics`
  // mounts the per-method limiters (mnemonicsRoutes.ts: GET 60, POST 10, PUT 30,
  // DELETE 30 /min per user) — the only ported routes with per-route limiters
  // in Express today. `readers` mounts the passage-GET limiters (readersRoutes.ts:
  // 60/min user, 20/min guest) on `/v1/readers/passages` — the dispatcher is
  // GET-only so the passage-audio POST and the sessions/bookmarks routes stay
  // un-limited exactly like Express. Each honors the same per-route config +
  // real-IP via trust proxy. Readers' 5/day generation limit is DB-backed
  // (24-12) and enforced by ReadersService.checkRateLimits.
  expressApp.use("/api/v1/words", rateLimitWordsByAuth);
  expressApp.use("/api/v1/auth/register", rateLimitAuth);
  expressApp.use("/api/v1/auth/login", rateLimitAuth);
  expressApp.use("/api/v1/mnemonics", rateLimitMnemonics);
  expressApp.use("/api/v1/readers/passages", rateLimitReadersByAuth);
  // Quiz AI-feedback limiter (aiFeedbackRoutes.ts: 10/min per IP) — mounted
  // path-scoped exactly like the Express inline `feedbackLimiter` guards only
  // the POST /v1/quiz/feedback route.
  expressApp.use("/api/v1/quiz/feedback", rateLimitQuizFeedback);

  // Graceful shutdown (Redis quit wiring lands in a later story).
  app.enableShutdownHooks();
}
