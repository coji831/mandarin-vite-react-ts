/**
 * @file apps/backend/src/modules/readers/nest/readers.module.ts
 * @description NestJS `@Module` for the Readers module (Story 24-12 — Readers
 * Port). The largest port (11 routes; SegmenterService/PassageGenerationService/
 * ReadersAudioService + the DB-backed 5/day generation rate-limit).
 *
 * Wires the five services (`ReadersService` + its deps `ReadersRepository`,
 * `SegmenterService`, `PassageGenerationService`, `ReadersAudioService`) as
 * `useFactory` providers. `SharedModule` supplies `CacheService` +
 * `GeminiService`; `GuardsModule` the calibrated `OptionalAuthGuard`/
 * `RequireAuthGuard`; `AudioModule` the `AudioService` facade +
 * `AUDIO_PASSAGE_PATHS`. The DB-backed 5/day generation limit is enforced in
 * `ReadersService.checkRateLimits` (UTC midnight reset). `useFactory` +
 * `@Inject()` (not auto constructor-param injection) because tsx/esbuild emits
 * no decorator metadata in the dev loop; the compiled tsc build gets metadata
 * for free.
 */

import { Module } from "@nestjs/common";
import { ReadersNestController } from "./readers-nest.controller.js";
import { ReadersRepository } from "../repositories/ReadersRepository.js";
import { ReadersService } from "../services/ReadersService.js";
import { SegmenterService } from "../services/SegmenterService.js";
import { PassageGenerationService } from "../services/PassageGenerationService.js";
import { ReadersAudioService } from "../services/ReadersAudioService.js";
import { SharedModule } from "../../../nest/shared/shared.module.js";
import { GuardsModule } from "../../../nest/guards/guards.module.js";
import { AudioModule, AUDIO_PASSAGE_PATHS } from "../../audio/nest/audio.module.js";
import { AudioService } from "../../audio/services/AudioService.js";
import { GeminiService } from "../../../shared/infrastructure/external/GeminiService.js";
import { CacheService } from "../../../shared/infrastructure/cache/CacheService.js";

@Module({
  imports: [SharedModule, GuardsModule, AudioModule],
  controllers: [ReadersNestController],
  providers: [
    { provide: ReadersRepository, useFactory: () => new ReadersRepository() },
    {
      provide: PassageGenerationService,
      useFactory: (geminiService: GeminiService) => new PassageGenerationService(geminiService),
      inject: [GeminiService],
    },
    {
      provide: SegmenterService,
      useFactory: (cacheService: CacheService) => new SegmenterService(cacheService),
      inject: [CacheService],
    },
    {
      provide: ReadersAudioService,
      useFactory: (
        audioService: AudioService,
        passagePathHelpers: {
          passageHashFor(texts: string[]): string;
          passagePath(hash: string, index: number): string;
        },
      ) => new ReadersAudioService(audioService, passagePathHelpers),
      inject: [AudioService, AUDIO_PASSAGE_PATHS],
    },
    {
      provide: ReadersService,
      useFactory: (
        repository: ReadersRepository,
        passageGenService: PassageGenerationService,
        segmenterService: SegmenterService,
        cacheService: CacheService,
        readersAudioService: ReadersAudioService,
      ) =>
        new ReadersService(
          repository,
          passageGenService,
          segmenterService,
          cacheService,
          readersAudioService,
        ),
      inject: [
        ReadersRepository,
        PassageGenerationService,
        SegmenterService,
        CacheService,
        ReadersAudioService,
      ],
    },
  ],
  exports: [ReadersService],
})
export class ReadersModule {}
