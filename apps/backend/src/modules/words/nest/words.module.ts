/**
 * @file apps/backend/src/modules/words/nest/words.module.ts
 * @description NestJS `@Module` for the Words module (Story 24-2 shell).
 *
 * 1:1 translation of `createWordsModule()` in `modules/words/container.ts`
 * (see docs/knowledge-base/backend/module-level-containers.md). Repositories
 * self-import the Prisma singleton — no shared infra module needed yet.
 *
 * Uses explicit `useFactory` providers + `@Inject()` decorators (NOT auto
 * constructor-param injection) because `tsx` (esbuild) does not emit decorator
 * metadata in the dev loop; the compiled tsc build gets metadata for free.
 *
 * The Express wiring (`container.ts`, `api/WordsController.ts`,
 * `api/WordsRoutes.ts`) is UNTOUCHED — this module coexists as the Nest shell
 * surface and is deleted at the module's cutover (24-15).
 */

import { Module } from "@nestjs/common";
import { WordsNestController } from "./words-nest.controller.js";
import { WordsRepository } from "../repositories/WordsRepository.js";
import { MeasureWordRepository } from "../repositories/MeasureWordRepository.js";
import { WordsService } from "../services/WordsService.js";
import { MeasureWordService } from "../services/MeasureWordService.js";

@Module({
  controllers: [WordsNestController],
  providers: [
    { provide: WordsRepository, useFactory: () => new WordsRepository() },
    { provide: MeasureWordRepository, useFactory: () => new MeasureWordRepository() },
    {
      provide: WordsService,
      useFactory: (repository: WordsRepository) => new WordsService(repository),
      inject: [WordsRepository],
    },
    {
      provide: MeasureWordService,
      useFactory: (repository: MeasureWordRepository) => new MeasureWordService(repository),
      inject: [MeasureWordRepository],
    },
  ],
  exports: [WordsService, MeasureWordService],
})
export class WordsModule {}
