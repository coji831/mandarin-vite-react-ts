/**
 * @file apps/backend/src/nest/guards/guards.module.ts
 * @description NestJS `GuardsModule` — makes the calibrated auth guards
 * (Story 24-5) available to module ports as Nest providers.
 *
 * The guards are PROVIDERS, not global (`APP_GUARD` would break the 4 public
 * reference-module routes): each consumer module imports `GuardsModule` and
 * applies the guard it needs via `@UseGuards(...)` — `AuthGuard` (required
 * auth), `OptionalAuthGuard` (best-effort reads), `RequireAuthGuard`
 * (guest-rejecting user-scoped/cost-bearing routes). `SharedModule` is
 * imported (the guards inject `JwtService`) and RE-EXPORTED so a consumer
 * applying the guards can resolve `JwtService` in its own context.
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
