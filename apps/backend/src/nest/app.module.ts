/**
 * @file apps/backend/src/nest/app.module.ts
 * @description Root NestJS module for the dev-only shell.
 *
 * Story 24-2 — deliberately imports ONLY the four ported reference modules
 * (words, phonetic-clusters, grammar, chengyu). No shared infra module and no
 * health module yet — the shell is a pure proof-of-pattern.
 *
 * Story 24-3 — registers the global `AppExceptionFilter` (APP_FILTER) so every
 * 4xx/5xx on the shell emits the Express `{code, message, requestId}` envelope.
 *
 * Story 24-4 — wires `SharedModule` (which imports `DatabaseModule`) so the
 * shared infrastructure (config homes, CacheService async provider, Prisma
 * client, JwtService/PasswordService, external clients) is available to later
 * module ports as Nest providers, with graceful shutdown hooks.
 *
 * Story 24-5 — wires `GuardsModule` so the calibrated auth guards
 * (`AuthGuard`/`OptionalAuthGuard`/`RequireAuthGuard`) are registered as
 * providers and available to later module ports (24-6 auth, 24-8 mnemonics,
 * 24-10 audio, 24-11 review, 24-12 readers, 24-13 quiz/progression). They are
 * NOT applied globally — later modules apply them per-route via `@UseGuards`.
 *
 * Story 24-8 — wires `CharactersModule` (two-controller module: deep-param
 * routing + /search; public static data) and `MnemonicsModule` (the first
 * consumer of `SharedModule` cache/gemini + the calibrated `OptionalAuthGuard`
 * on a read route and `RequireAuthGuard` on the write routes).
 *
 * Story 24-9 — wires `FoundationsModule` + `RadicalsModule` (both zero-dep
 * public reference-data modules; services self-import Prisma like characters).
 * `FoundationsModule` is imported BEFORE `CharactersModule` to reproduce the
 * Express `src/app/routes.ts` mount order (foundations L60, characters L126):
 * Nest registers routes in module-import order onto the same Express router, so
 * foundations' `GET /v1/characters/:glyph` captures every single-segment
 * `/v1/characters/<x>` and shadows the characters module's `:glyph` (plus its
 * `/search` / `/frequency`) — matching the live Express behavior byte-for-byte.
 *
 * Story 24-10 — wires `AudioModule` (`POST /v1/tts` with the calibrated
 * `OptionalAuthGuard`, F5 TTS surface) and `HealthModule` (`GET /v1/health`).
 * `HealthModule` imports `AudioModule` (module-to-module Nest DI) — resolving
 * the Express health wiring's direct `modules/audio/index.js` import with NO
 * direct cross-module barrel import in Nest land. Both route files mount at
 * the top of `app/routes.ts` (health L49, audio L64); import order here is
 * immaterial to those paths (no overlapping prefixes).
 */

import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { WordsModule } from "../modules/words/nest/words.module.js";
import { PhoneticClustersModule } from "../modules/phonetic-clusters/nest/phonetic-clusters.module.js";
import { GrammarModule } from "../modules/grammar/nest/grammar.module.js";
import { ChengyuModule } from "../modules/chengyu/nest/chengyu.module.js";
import { AuthModule } from "../modules/auth/nest/auth.module.js";
import { FoundationsModule } from "../modules/foundations/nest/foundations.module.js";
import { RadicalsModule } from "../modules/radicals/nest/radicals.module.js";
import { CharactersModule } from "../modules/characters/nest/characters.module.js";
import { MnemonicsModule } from "../modules/mnemonics/nest/mnemonics.module.js";
import { AudioModule } from "../modules/audio/nest/audio.module.js";
import { HealthModule } from "../modules/health/nest/health.module.js";
import { SharedModule } from "./shared/shared.module.js";
import { GuardsModule } from "./guards/guards.module.js";
import { AppExceptionFilter } from "./exception.filter.js";

@Module({
  imports: [
    WordsModule,
    PhoneticClustersModule,
    GrammarModule,
    ChengyuModule,
    AuthModule,
    // Foundations BEFORE Characters — reproduces the Express shadow where
    // foundations' `GET /v1/characters/:glyph` captures the single-segment
    // character path (see the class docstring on FoundationsNestController).
    FoundationsModule,
    RadicalsModule,
    CharactersModule,
    MnemonicsModule,
    // Audio (POST /v1/tts, calibrated OptionalAuthGuard) + Health (GET
    // /v1/health; imports AudioModule for the AudioService DI). Both mounted
    // at the top of the Express routes.ts — no prefix overlap with the above.
    AudioModule,
    HealthModule,
    SharedModule,
    GuardsModule,
  ],
  providers: [{ provide: APP_FILTER, useClass: AppExceptionFilter }],
})
export class AppModule {}
