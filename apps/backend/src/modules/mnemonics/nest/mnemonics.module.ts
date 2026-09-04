/**
 * @file apps/backend/src/modules/mnemonics/nest/mnemonics.module.ts
 * @description NestJS `@Module` for the Mnemonics module (Story 24-8 —
 * Characters + Mnemonics Port). The first consumer of the shared infra
 * (`SharedModule` cache + gemini) and of the calibrated `OptionalAuthGuard`
 * on the Nest shell.
 *
 * Wires `MnemonicsService` (constructor-injected with `MnemonicsRepository` +
 * `GeminiService` + `CacheService`, the latter two from `SharedModule`) via a
 * `useFactory` provider and exports it. `GuardsModule` is imported so the
 * calibrated `OptionalAuthGuard`/`RequireAuthGuard` and their `JwtService`
 * dependency resolve in this module's context.
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
