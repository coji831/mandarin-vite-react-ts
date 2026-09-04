/**
 * @file apps/backend/src/modules/foundations/nest/foundations.module.ts
 * @description NestJS `@Module` for the Foundations module (Story 24-9 —
 * Radicals + Foundations Port).
 *
 * Wires `FoundationsService` (zero-dep; self-imports Prisma) via a
 * `useFactory` provider and exports it. Foundations reads entirely from Prisma
 * reference tables (pinyin tones / character map / strokes / character detail
 * are all-in-DB) — no `contentUtils` provider is injected and `SharedModule`
 * is NOT imported (public static reference data; no auth/cache/external
 * clients). `useFactory` + `@Inject()` (not auto constructor-param injection)
 * because tsx/esbuild emits no decorator metadata in the dev loop; the
 * compiled tsc build gets metadata for free.
 */

import { Module } from "@nestjs/common";
import { FoundationsNestController } from "./foundations-nest.controller.js";
import { FoundationsService } from "../services/FoundationsService.js";

@Module({
  controllers: [FoundationsNestController],
  providers: [{ provide: FoundationsService, useFactory: () => new FoundationsService() }],
  exports: [FoundationsService],
})
export class FoundationsModule {}
