/**
 * @file apps/backend/src/modules/grammar/nest/grammar.module.ts
 * @description NestJS `@Module` for the Grammar module (Story 24-2 shell).
 *
 * 1:1 translation of `createGrammarModule()` in `modules/grammar/container.ts`.
 * Explicit `useFactory` providers + `@Inject()` decorators (tsx/esbuild emits
 * no decorator metadata in dev).
 *
 * The Express wiring is UNTOUCHED — this module coexists as the Nest shell
 * surface and is deleted at the module's cutover (24-15).
 */

import { Module } from "@nestjs/common";
import { GrammarNestController } from "./grammar-nest.controller.js";
import { GrammarRepository } from "../repositories/GrammarRepository.js";
import { GrammarService } from "../services/GrammarService.js";

@Module({
  controllers: [GrammarNestController],
  providers: [
    { provide: GrammarRepository, useFactory: () => new GrammarRepository() },
    {
      provide: GrammarService,
      useFactory: (repository: GrammarRepository) => new GrammarService(repository),
      inject: [GrammarRepository],
    },
  ],
  exports: [GrammarService],
})
export class GrammarModule {}
