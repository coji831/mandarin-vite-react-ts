/**
 * @file apps/backend/src/nest/guards/guards.module.ts
 * @description NestJS `GuardsModule` — makes the calibrated auth guards
 * (Story 24-5) available to later module ports as Nest providers.
 *
 * Wiring intent (per the 24-5 story): the guards are PROVIDERS available for
 * later stories to apply per-route via `@UseGuards(...)` — they are NOT
 * registered globally (`APP_GUARD`) because a global guard would break the 4
 * ported reference modules' public routes (words / phonetic-clusters /
 * grammar / chengyu are unauthenticated). Each later module imports
 * `GuardsModule` and applies the guard it needs:
 *   - `AuthGuard`            → required-auth routes (24-6 `/auth/me`)
 *   - `OptionalAuthGuard`    → calibrated best-effort reads (24-8 mnemonics,
 *                              24-10 TTS, 24-13 quiz/progression guests)
 *   - `RequireAuthGuard`     → guest-rejecting user-scoped/cost-bearing routes
 *                              (24-11 review, 24-12 readers generate, 24-13)
 *
 * The guards inject `JwtService` (provided + exported by `SharedModule`, 24-4),
 * so this module imports `SharedModule` to resolve it — and RE-EXPORTS
 * `SharedModule` so that any consumer module applying the guards via
 * `@UseGuards(AuthGuard)` can resolve the guard's OWN dependencies (`JwtService`)
 * in its own context (Nest resolves enhancer dependencies through the consumer
 * module's imported/exposed providers). Without the re-export, a controller
 * using `@UseGuards(AuthGuard)` fails with "can't resolve JwtService".
 */

import { Module } from "@nestjs/common";
import { SharedModule } from "../shared/shared.module.js";
import { AuthGuard } from "./auth-guard.js";
import { OptionalAuthGuard } from "./optional-auth.guard.js";
import { RequireAuthGuard } from "./require-auth.guard.js";

@Module({
  imports: [SharedModule],
  providers: [AuthGuard, OptionalAuthGuard, RequireAuthGuard],
  exports: [SharedModule, AuthGuard, OptionalAuthGuard, RequireAuthGuard],
})
export class GuardsModule {}
