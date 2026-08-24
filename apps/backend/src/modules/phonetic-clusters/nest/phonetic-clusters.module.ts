/**
 * @file apps/backend/src/modules/phonetic-clusters/nest/phonetic-clusters.module.ts
 * @description NestJS `@Module` for the Phonetic Clusters module (Story 24-2 shell).
 *
 * Wires `PhoneticClustersService` (constructor-injected with
 * `PhoneticClustersRepository`) via a `useFactory` provider and exports it.
 * The repository self-imports the Prisma singleton, so no `SharedModule` is
 * needed. `useFactory` + `@Inject()` (not auto constructor-param injection)
 * because tsx/esbuild emits no decorator metadata in the dev loop; the
 * compiled tsc build gets metadata for free.
 */

import { Module } from "@nestjs/common";
import { PhoneticClustersNestController } from "./phonetic-clusters-nest.controller.js";
import { PhoneticClustersRepository } from "../repositories/PhoneticClustersRepository.js";
import { PhoneticClustersService } from "../services/PhoneticClustersService.js";

@Module({
  controllers: [PhoneticClustersNestController],
  providers: [
    { provide: PhoneticClustersRepository, useFactory: () => new PhoneticClustersRepository() },
    {
      provide: PhoneticClustersService,
      useFactory: (repository: PhoneticClustersRepository) =>
        new PhoneticClustersService(repository),
      inject: [PhoneticClustersRepository],
    },
  ],
  exports: [PhoneticClustersService],
})
export class PhoneticClustersModule {}
