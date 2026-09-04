/**
 * @file apps/backend/src/nest/app.module.ts
 * @description Root NestJS module for the dev-only shell (Story 24-2).
 *
 * Wires every ported feature module plus `SharedModule` (shared infra
 * providers), `GuardsModule` (calibrated auth guards) and the global
 * `AppExceptionFilter` (APP_FILTER) so every 4xx/5xx emits the
 * `{ code, message, requestId }` envelope. The guards are NOT global — modules
 * apply them per-route via `@UseGuards`.
 *
 * MOUNT-ORDER SUBTLETY (parity-critical): `FoundationsModule` is imported
 * BEFORE `CharactersModule` — Nest registers routes in module-import order
 * onto the same Express router (first-match-wins), so foundations'
 * `GET /v1/characters/:glyph` captures every single-segment
 * `/v1/characters/<x>` and shadows the characters module's `:glyph` (plus its
 * `/search` / `/frequency`), byte-for-byte. `HealthModule` imports
 * `AudioModule` (module-to-module Nest DI for `AudioService`); all other
 * import order is immaterial (no overlapping prefixes).
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
import { ReviewModule } from "../modules/review/nest/review.module.js";
import { ReadersModule } from "../modules/readers/nest/readers.module.js";
import { QuizModule } from "../modules/quiz/nest/quiz.module.js";
import { ProgressionModule } from "../modules/progression/nest/progression.module.js";
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
    // Foundations BEFORE Characters — reproduces the mount-order shadow where
    // foundations' `GET /v1/characters/:glyph` captures the single-segment
    // character path (see the class docstring on FoundationsNestController).
    FoundationsModule,
    RadicalsModule,
    CharactersModule,
    MnemonicsModule,
    // Audio (POST /v1/tts, calibrated OptionalAuthGuard) + Health (GET
    // /v1/health; imports AudioModule for the AudioService DI). No prefix
    // overlap with the above.
    AudioModule,
    HealthModule,
    // Review (GET /v1/review/items + /due-count, POST /v1/review/result) with
    // the calibrated RequireAuthGuard (24-11) — user-scoped SRS state; the
    // repository reads/writes the absorbed additive SrsCardState table. Route
    // path /v1/review/* shares no prefix with any other module.
    ReviewModule,
    // Readers (11 routes — the largest port, 24-12): passages list/get + the
    // passage-audio POST (calibrated OptionalAuthGuard, F5 cache-first-free for
    // guests), generate (RequireAuthGuard + the DB-backed 5/day generation
    // limit) + sessions/bookmarks (RequireAuthGuard). Imports AudioModule for
    // the AudioService + AUDIO_PASSAGE_PATHS DI (no direct modules/audio import
    // in Nest land). Path /v1/readers/* shares no prefix with any other module.
    ReadersModule,
    // Quiz (8 routes, 24-13): config/questions/attempts(×4)/feedback + the
    // sandhi-drill route (sandhi-drill lives on its own controller). The guest
    // quiz SUBMIT surface gets the calibrated OptionalAuthGuard (session-local
    // mock shapes, no persistence); attempts GET + feedback → RequireAuthGuard.
    // Imports ProgressionModule via forwardRef (circular-DI ADR). Path
    // /v1/quiz/* shares no prefix with any other module.
    QuizModule,
    // Progression (7 routes, 24-13): foundation-progress/phase-gate/gates/
    // radical-progress. Read routes → calibrated OptionalAuthGuard (guest →
    // session-local/empty; the `/gates` guest branch is CALIBRATED to
    // Phase-1-only — not the all-passed GUEST shape Express still returns);
    // write routes → RequireAuthGuard. Imports QuizModule via forwardRef
    // (circular-DI ADR). Path /v1/progression/* shares no prefix with any other
    // module.
    ProgressionModule,
    SharedModule,
    GuardsModule,
  ],
  providers: [{ provide: APP_FILTER, useClass: AppExceptionFilter }],
})
export class AppModule {}
