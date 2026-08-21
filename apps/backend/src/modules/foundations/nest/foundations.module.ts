/**
 * @file apps/backend/src/modules/foundations/nest/foundations.module.ts
 * @description NestJS `@Module` for the Foundations module (Story 24-9 —
 * Radicals + Foundations Port).
 *
 * 1:1 translation of `createFoundationsModule()` in
 * `modules/foundations/container.ts`, wiring the same framework-agnostic
 * service through a Nest provider:
 *
 *   - `FoundationsService` — constructor takes nothing; self-imports the shared
 *     Prisma singleton (same as the Express path); provided via `useFactory`.
 *
 * DATA-SOURCE NOTE (reconciled with the story brief): the 24-9 brief mentions
 * foundations reading "via shared utils (contentUtils) — no DB", but the
 * CURRENT `FoundationsService` (unchanged since epic-21's all-in-DB data
 * lifecycle) reads entirely from Prisma reference tables — pinyin tones /
 * character map / strokes / character detail are all-in-DB, with no
 * `contentUtils` file reads at runtime. Because the story's binding directive
 * is to REUSE `FoundationsService` UNCHANGED, no `CONTENT_UTILS` provider is
 * injected and `SharedModule` is NOT imported here — matching the `characters`
 * port (24-8), whose repos also self-import Prisma.
 *
 * Foundations routes are PUBLIC static reference data — no auth, no cache, no
 * external clients — so no `SharedModule` is needed.
 *
 * Explicit `useFactory` providers + `@Inject()` decorators (NOT auto
 * constructor-param injection) because `tsx` (esbuild) does not emit decorator
 * metadata in the dev loop; the compiled tsc build gets metadata for free.
 *
 * The Express wiring (`container.ts`, `api/FoundationsController.ts`,
 * `api/foundationsRoutes.ts`) is UNTOUCHED — this module coexists as the Nest
 * shell surface and is deleted at the module's cutover (24-15).
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
