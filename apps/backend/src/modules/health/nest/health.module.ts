/**
 * @file apps/backend/src/modules/health/nest/health.module.ts
 * @description NestJS `@Module` for the Health module (Story 24-10 — Audio +
 * Health Port).
 *
 * Wires `HealthNestController` (serves `GET /api/v1/health`, the Railway
 * healthcheck path). `AudioModule` is imported and the controller injects the
 * exported `AudioService` via `@Inject(AudioService)` — module-to-module Nest
 * DI, no direct cross-module barrel import. `SharedModule` provides
 * `GeminiService`; the shared Redis singleton is provided locally as the
 * `RedisClient` token via `useFactory` so the controller can read the raw
 * ioredis client for the health ping.
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
    // controller can read the raw ioredis client for the health ping.
    { provide: RedisClient, useFactory: () => redisClient },
  ],
})
export class HealthModule {}
