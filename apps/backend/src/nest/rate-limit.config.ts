/**
 * @file apps/backend/src/nest/rate-limit.config.ts
 * @description Shared `express-rate-limit` configs for the Nest shell
 * (Story 24-3 — HTTP-Layer Parity).
 *
 * `express-rate-limit` (`^8.5.2`, already a dependency) is RETAINED and
 * mounted on the Nest Express adapter via `app.use`. `@nestjs/throttler` is
 * REJECTED (decision recorded in the story IMP): porting each per-route
 * config would rewrite key generation, trust-proxy handling, and the
 * response shape with a high parity-drift risk, while retaining
 * express-rate-limit gives exact parity with zero rewrite. The parity
 * harness (429 status + envelope) is the regression gate.
 *
 * The Express `src/app/index.ts` sets `trust proxy 1` so the rate limiter
 * reads the real client IP from `X-Forwarded-For` — the Nest shell mirrors
 * this in `configure-app.ts`.
 *
 * Config markers:
 *   - **[APPLIED]** — mounted on the shell now (the only ported route with a
 *     per-route limiter today is `words`).
 *   - **[INFRA]** — declared here but applied in later stories when those
 *     modules are ported (auth brute-force → 24-6; readers → 24-12), copying
 *     whatever is current then.
 *   - **[TEST]** — low-limit configs backing the parity harness's seeded 429
 *     route.
 */

import { rateLimit, type Options } from "express-rate-limit";
import type { NextFunction, Request, Response } from "express";

/** Configs are passed to `rateLimit()` which accepts `Partial<Options>`. */
type LimiterConfig = Partial<Options>;

// ── words — [APPLIED] (WordsRoutes.ts, byte-for-byte) ─────────────────────

/** Words GET limiter — 60 req/min per user. */
export const WORDS_GET_LIMITER_CONFIG: LimiterConfig = {
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  keyGenerator: (req: Request) => req.userId || req.ip || "unknown",
  message: {
    error: "Too many requests. Please wait a moment.",
    code: "RATE_LIMIT",
  },
  standardHeaders: true,
  legacyHeaders: false,
};

/** Words guest GET limiter — 20 req/min per IP. */
export const WORDS_GUEST_GET_LIMITER_CONFIG: LimiterConfig = {
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  keyGenerator: (req: Request) => req.ip || "unknown",
  message: {
    error: "Too many requests. Please wait a moment.",
    code: "RATE_LIMIT",
  },
  standardHeaders: true,
  legacyHeaders: false,
};

const wordsGetLimiter = rateLimit(WORDS_GET_LIMITER_CONFIG);
const wordsGuestGetLimiter = rateLimit(WORDS_GUEST_GET_LIMITER_CONFIG);

/** Route-level middleware: stricter limit for guests — mirrors WordsRoutes.ts. */
export function rateLimitWordsByAuth(req: Request, res: Response, next: NextFunction): void {
  if (req.userId) {
    wordsGetLimiter(req, res, next);
  } else {
    wordsGuestGetLimiter(req, res, next);
  }
}

// ── auth — [INFRA] (authRoutes.ts, applied in 24-6) ───────────────────────

/** Auth brute-force limiter — 5 req/min per IP (login/register). */
export const AUTH_LIMITER_CONFIG: LimiterConfig = {
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: {
    error: "Too Many Requests",
    code: "RATE_LIMIT_EXCEEDED",
    message: "Too many authentication attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
};

/**
 * Auth brute-force limiter INSTANCE — a single shared instance mounted on
 * BOTH `/register` and `/login` (mirrors `authRoutes.ts`, where one `authLimiter`
 * guards both routes → one shared per-IP counter). The default express-rate-limit
 * handler sends the `message` object directly as the 429 body, so the Nest 429
 * response is byte-identical to Express (`{ error, code, message }`, no envelope)
 * — proven by the 24-6 auth-parity harness. Applied in Story 24-6.
 */
const authLimiter = rateLimit(AUTH_LIMITER_CONFIG);

/** Route-level middleware: auth brute-force limiter (login/register). */
export function rateLimitAuth(req: Request, res: Response, next: NextFunction): void {
  authLimiter(req, res, next);
}

// ── readers — [INFRA] (readersRoutes.ts, applied in 24-12) ────────────────

/** Readers GET limiter — 60 req/min per user. */
export const READERS_GET_LIMITER_CONFIG: LimiterConfig = {
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  keyGenerator: (req: Request) => req.userId || req.ip || "unknown",
  message: {
    error: "Too many requests. Please wait a moment.",
    code: "RATE_LIMIT",
  },
  standardHeaders: true,
  legacyHeaders: false,
};

/** Readers guest GET limiter — 20 req/min per IP. */
export const READERS_GUEST_GET_LIMITER_CONFIG: LimiterConfig = {
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  keyGenerator: (req: Request) => req.ip || "unknown",
  message: {
    error: "Too many requests. Please wait a moment.",
    code: "RATE_LIMIT",
  },
  standardHeaders: true,
  legacyHeaders: false,
};

/**
 * Readers POST generate daily limit — 5/day per user, DB-backed (UTC midnight
 * reset), enforced in `ReadersService.checkRateLimits` — NOT express-rate-limit.
 * Declared as infra; applied when readers is ported (24-12).
 */
export const READERS_DAILY_GENERATION_LIMIT = 5;

// ── test — [TEST] (parity harness seeded 429 route) ───────────────────────

/**
 * Low-limit limiter for the harness's seeded 429 route. The custom `handler`
 * calls `next(err)` so the rate-limit error flows through the global
 * ExceptionFilter and the response carries the exact `{ code, message,
 * requestId }` envelope (proving 429 envelope parity on the shell).
 */
export const TEST_LIMITER_CONFIG: LimiterConfig = {
  windowMs: 60 * 1000, // 1 minute
  max: 2,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response, next: NextFunction) => {
    const error = new Error("Too many requests. Please wait a moment.") as Error & {
      code?: string;
      status?: number;
    };
    error.code = "RATE_LIMIT";
    error.status = 429;
    next(error);
  },
};

/**
 * Twin of `TEST_LIMITER_CONFIG` with the DEFAULT handler — mirrors how the
 * real Express per-route limiters render a 429 (message sent directly, no
 * envelope). Used by the harness to prove the same express-rate-limit config
 * yields the same 429 status on an equivalent Express mount.
 */
export const TEST_EXPRESS_LIMITER_CONFIG: LimiterConfig = {
  windowMs: 60 * 1000, // 1 minute
  max: 2,
  message: {
    error: "Too many requests. Please wait a moment.",
    code: "RATE_LIMIT",
  },
  standardHeaders: true,
  legacyHeaders: false,
};
