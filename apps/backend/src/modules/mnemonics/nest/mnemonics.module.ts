/**
 * @file apps/backend/src/modules/mnemonics/nest/mnemonics.module.ts
 * @description NestJS `@Module` for the Mnemonics module (Story 24-8 —
 * Characters + Mnemonics Port). The FIRST consumer of the shared infra
 * (`SharedModule` cache + gemini, 24-4) AND of the calibrated
 * `OptionalAuthGuard` (24-5) on the Nest shell.
 *
 * 1:1 translation of `createMnemonicsModule(deps)` in `modules/mnemonics/
 * container.ts`, wiring the same framework-agnostic service through Nest
 * providers:
 *
 *   - `MnemonicsRepository` — self-imports the shared Prisma singleton (same as
 *     the Express path); provided via `useFactory`.
 *   - `MnemonicsService`     — constructor-injected with `MnemonicsRepository` +
 *     `GeminiService` + `CacheService` (the SAME three deps the container
 *     factory takes; the latter two resolve from `SharedModule`, 24-4).
 *
 * `SharedModule` is imported for `GeminiService` + `CacheService`;
 * `GuardsModule` is imported so the calibrated `OptionalAuthGuard` /
 * `RequireAuthGuard` (and their `JwtService` dependency, which `GuardsModule`
 * re-exports) resolve in this module's context for the controller's
 * `@UseGuards(...)` decorators.
 *
 * Explicit `useFactory` providers + `@Inject()` decorators (NOT auto
 * constructor-param injection) because `tsx` (esbuild) does not emit decorator
 * metadata in the dev loop; the compiled tsc build gets metadata for free.
 *
 * The Express wiring (`container.ts`, `api/MnemonicsController.ts`,
 * `api/mnemonicsRoutes.ts`) is UNTOUCHED — this module coexists as the Nest
 * shell surface and is deleted at the module's cutover (24-15).
 */

import { Module } from "@nestjs/common";
import { MnemonicsNestController } from "./mnemonics-nest.controller.js";
import { MnemonicsRepository } from "../repositories/MnemonicsRepository.js";
import { MnemonicsService } from "../services/MnemonicsService.js";
import { SharedModule } from "../../../nest/shared/shared.module.js";
import { GuardsModule } from "../../../nest/guards/guards.module.js";
import { GeminiService } from "../../../shared/infrastructure/external/GeminiService.js";
import { CacheService } from "../../../shared/infrastructure/cache/CacheService.js";

@Module({
  imports: [SharedModule, GuardsModule],
  controllers: [MnemonicsNestController],
  providers: [
    { provide: MnemonicsRepository, useFactory: () => new MnemonicsRepository() },
    {
      provide: MnemonicsService,
      useFactory: (
        repository: MnemonicsRepository,
        geminiService: GeminiService,
        cacheService: CacheService,
      ) => new MnemonicsService(repository, geminiService, cacheService),
      inject: [MnemonicsRepository, GeminiService, CacheService],
    },
  ],
  exports: [MnemonicsService],
})
export class MnemonicsModule {}
