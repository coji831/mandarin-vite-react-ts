/**
 * @file apps/backend/src/modules/characters/nest/characters.module.ts
 * @description NestJS `@Module` for the Characters module (Story 24-8 —
 * Characters + Mnemonics Port). A TWO-controller module: `CharactersNestController`
 * (deep-param routing: `/:glyph/decomposition`, `/:glyph/homophones`, etc.) +
 * `PinyinNestController` (`/v1/pinyin/search`).
 *
 * Wires `CharactersService` + `PinyinSearchService` (each constructor-injected
 * with its repository) via `useFactory` providers and exports them.
 * Characters are PUBLIC static reference data — no auth, no cache, no external
 * clients — so no `SharedModule` is needed (repos self-import Prisma).
 * `useFactory` + `@Inject()` (not auto constructor-param injection) because
 * tsx/esbuild emits no decorator metadata in the dev loop; the compiled tsc
 * build gets metadata for free.
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
