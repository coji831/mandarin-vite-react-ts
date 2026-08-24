/**
 * @file apps/backend/src/modules/radicals/nest/radicals.module.ts
 * @description NestJS `@Module` for the Radicals module (Story 24-9 —
 * Radicals + Foundations Port).
 *
 * Wires `RadicalsService` (constructor-injected with `RadicalsRepository`),
 * `RadicalsRepository` and `RadicalCharacterService` via `useFactory`
 * providers and exports them. Radicals are PUBLIC static reference data — no
 * auth, no cache, no external clients — so no `SharedModule` is needed (repos
 * self-import Prisma). `useFactory` + `@Inject()` (not auto constructor-param
 * injection) because tsx/esbuild emits no decorator metadata in the dev loop;
 * the compiled tsc build gets metadata for free.
 */

import { Module } from "@nestjs/common";
import { RadicalsNestController } from "./radicals-nest.controller.js";
import { RadicalsRepository } from "../repositories/RadicalsRepository.js";
import { RadicalsService } from "../services/RadicalsService.js";
import { RadicalCharacterService } from "../services/RadicalCharacterService.js";

@Module({
  controllers: [RadicalsNestController],
  providers: [
    { provide: RadicalsRepository, useFactory: () => new RadicalsRepository() },
    {
      provide: RadicalsService,
      useFactory: (repository: RadicalsRepository) => new RadicalsService(repository),
      inject: [RadicalsRepository],
    },
    { provide: RadicalCharacterService, useFactory: () => new RadicalCharacterService() },
  ],
  exports: [RadicalsService, RadicalCharacterService],
})
export class RadicalsModule {}
