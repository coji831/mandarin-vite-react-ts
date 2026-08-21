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
 */

import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { WordsModule } from "../modules/words/nest/words.module.js";
import { PhoneticClustersModule } from "../modules/phonetic-clusters/nest/phonetic-clusters.module.js";
import { GrammarModule } from "../modules/grammar/nest/grammar.module.js";
import { ChengyuModule } from "../modules/chengyu/nest/chengyu.module.js";
import { AuthModule } from "../modules/auth/nest/auth.module.js";
import { CharactersModule } from "../modules/characters/nest/characters.module.js";
import { MnemonicsModule } from "../modules/mnemonics/nest/mnemonics.module.js";
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
    CharactersModule,
    MnemonicsModule,
    SharedModule,
    GuardsModule,
  ],
  providers: [{ provide: APP_FILTER, useClass: AppExceptionFilter }],
})
export class AppModule {}
