/**
 * @file apps/backend/tests/setup.ts
 * @description Vitest test setup - seeds deterministic test env + loads env vars.
 *
 * Seeds JWT secrets BEFORE any test module imports `src/shared/config`, which
 * captures `JWT_SECRET`/`JWT_REFRESH_SECRET` at module-import time
 * (config/index.ts → JwtService.ts). Without this, the JwtService suite (and
 * anything constructing JwtService) fails 24/24 on a clean checkout where the
 * gitignored root `.env.local` is absent (CI quality gate). Setting the vars
 * here is safe: dotenv never overwrites an already-set variable, so the
 * seeded values survive the `.env.local` load below.
 *
 * The seed is a deliberately NON-SECRET, LOW-ENTROPY test constant — a long
 * lowercase marker phrase, NOT 64-char pure hex — so secret scanners
 * (GitGuardian/gitleaks) never flag it.
 */

process.env.JWT_SECRET = "ci-only-test-jwt-secret-not-a-real-secret-0123456789abcdef0123";
process.env.JWT_REFRESH_SECRET =
  "ci-only-test-jwt-refresh-secret-not-a-real-secret-0123456789abcdef0123";

import "dotenv/config";
