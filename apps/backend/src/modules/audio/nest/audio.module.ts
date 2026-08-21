/**
 * @file apps/backend/src/modules/audio/nest/audio.module.ts
 * @description NestJS `@Module` for the Audio module (Story 24-10 — Audio +
 * Health Port).
 *
 * 1:1 translation of the Express audio wiring — `createAudioModule(deps)` in
 * `modules/audio/container.ts` + `app/container.ts`'s
 * `new AudioService(cacheService, gcsClient, ttsClient)` — wiring the SAME
 * framework-agnostic facade unchanged through Nest providers:
 *
 *   - `AudioService` — constructor-injected with `CacheService` + `GCSClient`
 *     + `GoogleTTSClient`, all three resolved from `SharedModule` (24-4). The
 *     facade composes `AudioSynthesizer` / `AudioPathCache` / `AudioUrlSigner`
 *     internally (unchanged); the audio capability config (`AUDIO_CONFIG_TOKEN`,
 *     `src/modules/audio/config.ts`) is also available from `SharedModule`.
 *
 * `SharedModule` is imported for `CacheService` + `GCSClient` +
 * `GoogleTTSClient` (+ the `AUDIO_CONFIG_TOKEN` the controller reads for the
 * voice default); `GuardsModule` is imported so the calibrated
 * `OptionalAuthGuard` (24-5) + its `JwtService` dependency resolve in this
 * module's context for the controller's `@UseGuards(OptionalAuthGuard)`.
 *
 * `AudioService` is EXPORTED so the Health module (24-10) can consume it via
 * module-to-module Nest DI — replacing the Express health wiring's direct
 * `modules/audio/index.js` import (NO direct cross-module barrel import in
 * Nest land).
 *
 * Explicit `useFactory` providers + `@Inject()` decorators (NOT auto
 * constructor-param injection) because `tsx` (esbuild) does not emit decorator
 * metadata in the dev loop; the compiled tsc build gets metadata for free.
 *
 * The Express wiring (`container.ts`, `api/AudioController.ts`,
 * `api/audioRoutes.ts`) is UNTOUCHED — this module coexists as the Nest shell
 * surface and is deleted at the module's cutover (24-15).
 */

import { Module } from "@nestjs/common";
import { AudioNestController } from "./audio-nest.controller.js";
import { AudioService } from "../services/AudioService.js";
import { SharedModule } from "../../../nest/shared/shared.module.js";
import { GuardsModule } from "../../../nest/guards/guards.module.js";
import { CacheService } from "../../../shared/infrastructure/cache/CacheService.js";
import { GCSClient } from "../../../shared/infrastructure/external/GCSClient.js";
import { GoogleTTSClient } from "../../../shared/infrastructure/external/GoogleTTSClient.js";

@Module({
  imports: [SharedModule, GuardsModule],
  controllers: [AudioNestController],
  providers: [
    {
      provide: AudioService,
      useFactory: (cacheService: CacheService, gcsClient: GCSClient, ttsClient: GoogleTTSClient) =>
        new AudioService(cacheService, gcsClient, ttsClient),
      inject: [CacheService, GCSClient, GoogleTTSClient],
    },
  ],
  exports: [AudioService],
})
export class AudioModule {}
