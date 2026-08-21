/**
 * @file apps/backend/src/modules/phonetic-clusters/nest/phonetic-clusters.module.ts
 * @description NestJS `@Module` for the Phonetic Clusters module (Story 24-2 shell).
 *
 * 1:1 translation of `createPhoneticClustersModule()` in
 * `modules/phonetic-clusters/container.ts`. Explicit `useFactory` providers +
 * `@Inject()` decorators (tsx/esbuild emits no decorator metadata in dev).
 *
 * The Express wiring is UNTOUCHED — this module coexists as the Nest shell
 * surface and is deleted at the module's cutover (24-15).
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
