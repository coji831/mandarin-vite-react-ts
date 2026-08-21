/**
 * @file apps/backend/src/modules/readers/nest/readers.module.ts
 * @description NestJS `@Module` for the Readers module (Story 24-12 — Readers
 * Port). The largest port (11 routes; SegmenterService/PassageGenerationService/
 * ReadersAudioService + the DB-backed 5/day generation rate-limit).
 *
 * 1:1 translation of the Express readers wiring (`createReadersModule(deps)` in
 * `modules/readers/container.ts` + `app/container.ts`'s root-instantiated
 * service singletons), wiring the SAME framework-agnostic services through
 * Nest providers — moving ownership of the services INTO this module:
 *
 *   - `SegmenterService` — constructor-injected with `CacheService` (the same
 *     dep `app/container.ts` passes: `new SegmenterService(cacheService)`);
 *     self-imports the shared Prisma singleton for the in-memory word index.
 *   - `PassageGenerationService` — constructor-injected with `GeminiService`
 *     (`new PassageGenerationService(geminiService)`), resolved from
 *     `SharedModule` (24-4).
 *   - `ReadersAudioService` — constructor-injected with the `AudioService`
 *     facade (from the ported `AudioModule`, 24-10) AND the passage path
 *     helpers (`AUDIO_PASSAGE_PATHS`, provided by `AudioModule`). This
 *     replaces the Express wiring's DIRECT `modules/audio` function import —
 *     no direct cross-module barrel import in Nest land (Story 24-12 scope 2).
 *   - `ReadersRepository` — self-imports the shared Prisma singleton (same as
 *     the Express path); provided via `useFactory`.
 *   - `ReadersService` — constructor-injected with the four above + the shared
 *     `CacheService`, exactly the five deps `createReadersModule` passes. The
 *     DB-backed 5/day generation limit is enforced HERE (unchanged
 *     `checkRateLimits` → `ReadersRepository.countUserGeneratedToday`, UTC
 *     midnight reset) — reproduced as-is on the Nest surface.
 *
 * `SharedModule` is imported for `CacheService` + `GeminiService`;
 * `GuardsModule` for the calibrated `OptionalAuthGuard` (passages/audio reads,
 * F5) + `RequireAuthGuard` (generate/sessions/bookmarks); `AudioModule` for
 * `AudioService` + `AUDIO_PASSAGE_PATHS`.
 *
 * Explicit `useFactory` providers + `@Inject()` decorators (NOT auto
 * constructor-param injection) because `tsx` (esbuild) does not emit decorator
 * metadata in the dev loop; the compiled tsc build gets metadata for free.
 *
 * The Express wiring (`container.ts`, `api/ReadersController.ts`,
 * `api/readersRoutes.ts`) is UNTOUCHED — this module coexists as the Nest shell
 * surface (dual-mode) and is deleted at the module's cutover (24-15).
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
        passagePathHelpers: { passageHashFor(texts: string[]): string; passagePath(hash: string, index: number): string },
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
