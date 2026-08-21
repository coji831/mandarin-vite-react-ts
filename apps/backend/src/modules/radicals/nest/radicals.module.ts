/**
 * @file apps/backend/src/modules/radicals/nest/radicals.module.ts
 * @description NestJS `@Module` for the Radicals module (Story 24-9 —
 * Radicals + Foundations Port).
 *
 * 1:1 translation of `createRadicalsModule()` in `modules/radicals/container.ts`,
 * wiring the same framework-agnostic services through Nest providers:
 *
 *   - `RadicalsRepository`        — self-imports the shared Prisma singleton
 *     (same as the Express path); provided via `useFactory`.
 *   - `RadicalsService`           — constructor-injected with `RadicalsRepository`.
 *   - `RadicalCharacterService`   — self-imports the shared Prisma singleton;
 *     provided via `useFactory`.
 *
 * Radicals are PUBLIC static reference data — no auth, no cache, no external
 * clients — so no `SharedModule` is needed (repos self-import Prisma, matching
 * the `words` port in 24-2 and the `characters` port in 24-8).
 *
 * Explicit `useFactory` providers + `@Inject()` decorators (NOT auto
 * constructor-param injection) because `tsx` (esbuild) does not emit decorator
 * metadata in the dev loop; the compiled tsc build gets metadata for free.
 *
 * The Express wiring (`container.ts`, `api/RadicalsController.ts`,
 * `api/radicalsRoutes.ts`) is UNTOUCHED — this module coexists as the Nest
 * shell surface and is deleted at the module's cutover (24-15).
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
