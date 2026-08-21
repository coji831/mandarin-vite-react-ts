/**
 * @file apps/backend/src/modules/chengyu/nest/chengyu.module.ts
 * @description NestJS `@Module` for the Chengyu module (Story 24-2 shell).
 *
 * 1:1 translation of `createChengyuModule()` in `modules/chengyu/container.ts`.
 * Explicit `useFactory` providers + `@Inject()` decorators (tsx/esbuild emits
 * no decorator metadata in dev).
 *
 * The Express wiring is UNTOUCHED — this module coexists as the Nest shell
 * surface and is deleted at the module's cutover (24-15).
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
