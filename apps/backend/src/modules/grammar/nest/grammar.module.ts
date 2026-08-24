/**
 * @file apps/backend/src/modules/grammar/nest/grammar.module.ts
 * @description NestJS `@Module` for the Grammar module (Story 24-2 shell).
 *
 * Wires `GrammarService` (constructor-injected with `GrammarRepository`) via a
 * `useFactory` provider and exports it. The repository self-imports the Prisma
 * singleton, so no `SharedModule` is needed. `useFactory` + `@Inject()` (not
 * auto constructor-param injection) because tsx/esbuild emits no decorator
 * metadata in the dev loop; the compiled tsc build gets metadata for free.
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
