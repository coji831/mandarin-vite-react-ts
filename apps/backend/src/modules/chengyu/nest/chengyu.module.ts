/**
 * @file apps/backend/src/modules/chengyu/nest/chengyu.module.ts
 * @description NestJS `@Module` for the Chengyu module (Story 24-2 shell).
 *
 * Wires `ChengyuService` (constructor-injected with `ChengyuRepository`) via a
 * `useFactory` provider and exports it. The repository self-imports the Prisma
 * singleton, so no `SharedModule` is needed. `useFactory` + `@Inject()` (not
 * auto constructor-param injection) because tsx/esbuild emits no decorator
 * metadata in the dev loop; the compiled tsc build gets metadata for free.
 */

import { Module } from "@nestjs/common";
import { ChengyuNestController } from "./chengyu-nest.controller.js";
import { ChengyuRepository } from "../repositories/ChengyuRepository.js";
import { ChengyuService } from "../services/ChengyuService.js";

@Module({
  controllers: [ChengyuNestController],
  providers: [
    { provide: ChengyuRepository, useFactory: () => new ChengyuRepository() },
    {
      provide: ChengyuService,
      useFactory: (repository: ChengyuRepository) => new ChengyuService(repository),
      inject: [ChengyuRepository],
    },
  ],
  exports: [ChengyuService],
})
export class ChengyuModule {}
