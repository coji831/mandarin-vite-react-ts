/**
 * @file apps/backend/src/modules/words/nest/words.module.ts
 * @description NestJS `@Module` for the Words module (Story 24-2 shell).
 *
 * Wires `WordsService` + `MeasureWordService` (each constructor-injected with
 * its repository) via explicit `useFactory` providers, and exports both
 * services for module-to-module Nest DI. Repositories self-import the Prisma
 * singleton, so no `SharedModule` is needed. `useFactory` + `@Inject()` (not
 * auto constructor-param injection) because tsx/esbuild emits no decorator
 * metadata in the dev loop; the compiled tsc build gets metadata for free.
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
