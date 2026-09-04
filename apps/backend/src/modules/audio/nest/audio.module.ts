/**
 * @file apps/backend/src/modules/audio/nest/audio.module.ts
 * @description NestJS `@Module` for the Audio module (Story 24-10 — Audio +
 * Health Port).
 *
 * Wires `AudioService` (constructor-injected with `CacheService` + `GCSClient`
 * + `GoogleTTSClient`, all from `SharedModule`) and the `AUDIO_PASSAGE_PATHS`
 * value provider, exporting both so the Health/Readers modules resolve them
 * via module-to-module Nest DI. `GuardsModule` is imported so the calibrated
 * `OptionalAuthGuard` (applied to the TTS route) and its `JwtService`
 * dependency resolve in this module's context. `useFactory` + `@Inject()` (not
 * auto constructor-param injection) because tsx/esbuild emits no decorator
 * metadata in the dev loop; the compiled tsc build gets metadata for free.
 */

import { Module } from "@nestjs/common";
import { AudioNestController } from "./audio-nest.controller.js";
import { AudioService } from "../services/AudioService.js";
import { passageHashFor, passagePath } from "../services/paths.js";
import { SharedModule } from "../../../nest/shared/shared.module.js";
import { GuardsModule } from "../../../nest/guards/guards.module.js";
import { CacheService } from "../../../shared/infrastructure/cache/CacheService.js";
import { GCSClient } from "../../../shared/infrastructure/external/GCSClient.js";
import { GoogleTTSClient } from "../../../shared/infrastructure/external/GoogleTTSClient.js";

/**
 * Injection token for the passage-audio path helpers (`passageHashFor` /
 * `passagePath`). Provided + exported so the Readers module (24-12) resolves
 * them via module-to-module Nest DI.
 */
export const AUDIO_PASSAGE_PATHS = "AUDIO_PASSAGE_PATHS" as const;

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
    // Passage-audio path helpers as a DI provider (Story 24-12:
    // ReadersAudioService consumes them via `@Inject`).
    { provide: AUDIO_PASSAGE_PATHS, useValue: { passageHashFor, passagePath } },
  ],
  exports: [AudioService, AUDIO_PASSAGE_PATHS],
})
export class AudioModule {}
