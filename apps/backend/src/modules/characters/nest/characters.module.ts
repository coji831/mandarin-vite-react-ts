/**
 * @file apps/backend/src/modules/characters/nest/characters.module.ts
 * @description NestJS `@Module` for the Characters module (Story 24-8 —
 * Characters + Mnemonics Port). A TWO-controller module: `CharactersNestController`
 * (deep-param routing: `/:glyph/decomposition`, `/:glyph/homophones`, etc.) +
 * `PinyinNestController` (`/v1/pinyin/search`).
 *
 * 1:1 translation of `createCharactersModule()` + `createPinyinModule()` in
 * `modules/characters/container.ts`, wiring the same framework-agnostic
 * services through Nest providers:
 *
 *   - `CharactersRepository` / `PinyinSearchRepository` — self-import the shared
 *     Prisma singleton (same as the Express path); provided via `useFactory`.
 *   - `CharactersService`     — constructor-injected with `CharactersRepository`.
 *   - `PinyinSearchService`   — constructor-injected with `PinyinSearchRepository`.
 *
 * Characters are PUBLIC static reference data — no auth, no cache, no external
 * clients — so no `SharedModule` is needed (repos self-import Prisma, matching
 * the `words` port in 24-2).
 *
 * Explicit `useFactory` providers + `@Inject()` decorators (NOT auto
 * constructor-param injection) because `tsx` (esbuild) does not emit decorator
 * metadata in the dev loop; the compiled tsc build gets metadata for free.
 *
 * The Express wiring (`container.ts`, `api/CharactersController.ts`,
 * `api/PinyinController.ts`, `api/charactersRoutes.ts`, `api/pinyinRoutes.ts`)
 * is UNTOUCHED — this module coexists as the Nest shell surface and is deleted
 * at the module's cutover (24-15).
 */

import { Module } from "@nestjs/common";
import { CharactersNestController } from "./characters-nest.controller.js";
import { PinyinNestController } from "./pinyin-nest.controller.js";
import { CharactersRepository } from "../repositories/CharactersRepository.js";
import { PinyinSearchRepository } from "../repositories/PinyinSearchRepository.js";
import { CharactersService } from "../services/CharactersService.js";
import { PinyinSearchService } from "../services/PinyinSearchService.js";

@Module({
  controllers: [CharactersNestController, PinyinNestController],
  providers: [
    { provide: CharactersRepository, useFactory: () => new CharactersRepository() },
    { provide: PinyinSearchRepository, useFactory: () => new PinyinSearchRepository() },
    {
      provide: CharactersService,
      useFactory: (repository: CharactersRepository) => new CharactersService(repository),
      inject: [CharactersRepository],
    },
    {
      provide: PinyinSearchService,
      useFactory: (repository: PinyinSearchRepository) => new PinyinSearchService(repository),
      inject: [PinyinSearchRepository],
    },
  ],
  exports: [CharactersService, PinyinSearchService],
})
export class CharactersModule {}
