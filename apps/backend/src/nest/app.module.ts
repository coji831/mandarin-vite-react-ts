/**
 * @file apps/backend/src/nest/app.module.ts
 * @description Root NestJS module for the dev-only shell.
 *
 * Story 24-2 — deliberately imports ONLY the four ported reference modules
 * (words, phonetic-clusters, grammar, chengyu). No shared infra module and no
 * health module yet — the shell is a pure proof-of-pattern. SharedModule /
 * DatabaseModule land in 24-4 when cache/gemini/jwt-dependent modules are
 * ported.
 */

import { Module } from "@nestjs/common";
import { WordsModule } from "../modules/words/nest/words.module.js";
import { PhoneticClustersModule } from "../modules/phonetic-clusters/nest/phonetic-clusters.module.js";
import { GrammarModule } from "../modules/grammar/nest/grammar.module.js";
import { ChengyuModule } from "../modules/chengyu/nest/chengyu.module.js";

@Module({
  imports: [WordsModule, PhoneticClustersModule, GrammarModule, ChengyuModule],
})
export class AppModule {}
