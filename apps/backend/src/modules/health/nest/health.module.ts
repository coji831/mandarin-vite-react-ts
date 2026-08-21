/**
 * @file apps/backend/src/modules/health/nest/health.module.ts
 * @description NestJS `@Module` for the Health module (Story 24-10 — Audio +
 * Health Port).
 *
 * Resolves the DIRECT cross-module import that the Express health wiring has:
 * `modules/health/container.ts` imports `AudioServiceLike` from
 * `../../modules/audio/index.js`. On the Nest shell that is replaced by
 * module-to-module injection:
 *
 *   - `AudioModule` is IMPORTED (the Nest audio module exports `AudioService`),
 *     and `HealthNestController` injects it via `@Inject(AudioService)` — NO
 *     direct `modules/audio/index.js` import in Nest land.
 *   - `SharedModule` is imported for `GeminiService` (external AI client).
 *   - `RedisClient` (the shared singleton, `shared/infrastructure/redis`) is
 *     provided locally via `useFactory` — a value provider over the existing
 *     shared singleton, so the raw-client ping wiring mirrors the Express
 *     `container.ts` exactly without touching `SharedModule`.
 *
 * Explicit `useFactory` provider + `@Inject()` decorators (NOT auto
 * constructor-param injection) because `tsx` (esbuild) does not emit decorator
 * metadata in the dev loop; the compiled tsc build gets metadata for free.
 *
 * The Express wiring (`container.ts`, `api/HealthController.ts`,
 * `api/healthRoutes.ts`) is UNTOUCHED — the Express `/api/v1/health` stays the
 * Railway healthcheck path until cutover (24-15); this module coexists as the
 * Nest shell surface and is deleted at the module's cutover.
 */

import { Module } from "@nestjs/common";
import { HealthNestController } from "./health-nest.controller.js";
import { AudioModule } from "../../audio/nest/audio.module.js";
import { SharedModule } from "../../../nest/shared/shared.module.js";
import { RedisClient, redisClient } from "../../../shared/infrastructure/redis/RedisClient.js";

@Module({
  imports: [SharedModule, AudioModule],
  controllers: [HealthNestController],
  providers: [
    // Provide the shared Redis singleton as the `RedisClient` token so the
    // controller can read the raw ioredis client for the health ping (mirrors
    // the Express `container.ts` `redisClient.getClient()` wiring).
    { provide: RedisClient, useFactory: () => redisClient },
  ],
})
export class HealthModule {}
