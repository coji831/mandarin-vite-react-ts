/**
 * @file apps/backend/src/nest/shared/shared.module.ts
 * @description NestJS `SharedModule` — exposes the shared infrastructure as
 * Nest providers so cache/gemini/jwt-dependent modules (mnemonics, auth,
 * audio, readers, quiz, progression) resolve them through Nest DI (Story 24-4).
 *
 * Providers:
 *   - `CONFIG` (readonly `config` from `src/shared/config`) — the primary
 *     config home, plus `GATE_THRESHOLDS` (`src/config/gate-thresholds.ts`)
 *     and `audioConfig` (`src/modules/audio/config.ts`) — the three config
 *     homes rationalized into Nest providers.
 *   - `CacheService` via async `useFactory` (`await CacheFactory.create("default")`)
 *     — resolves the Express container's top-level await before first request.
 *   - `CONTENT_UTILS` (the `contentUtils` module namespace), the shared
 *     `WordRepository` (implements `IWordRepository`), `JwtService`,
 *     `PasswordService`.
 *   - External clients (`GeminiClient`, `GCSClient`, `GoogleTTSClient`,
 *     `GeminiService`) and `GcsFileStore` as lazy-singleton providers —
 *     constructors take nothing / read `config` at call time, so there is NO
 *     top-level `new GCSClient()` in Nest land; `GcsFileStore` constructor-
 *     injects the `GCSClient` provider.
 *   - `PrismaClient` is NOT re-exported directly — `DatabaseModule` (which
 *     provides + exports it) is re-exported instead, so consumers that import
 *     `SharedModule` can `@Inject(PrismaClient)` transitively.
 *
 * Graceful shutdown (R2 AC): `onApplicationShutdown` quits the shared Redis
 * client — `redisClient` is the connection owner behind `CacheService` (which
 * exposes no teardown of its own) — so the shell drains cleanly on SIGTERM.
 * Prisma teardown lives on `DatabaseModule`.
 */

import { Module, OnApplicationShutdown } from "@nestjs/common";
import { config } from "../../shared/config/index.js";
import { GATE_THRESHOLDS } from "../../config/gate-thresholds.js";
import { audioConfig } from "../../modules/audio/config.js";
import * as contentUtils from "../../shared/utils/contentUtils.js";
import { CacheFactory } from "../../shared/infrastructure/cache/CacheFactory.js";
import { CacheService } from "../../shared/infrastructure/cache/CacheService.js";
import { redisClient } from "../../shared/infrastructure/redis/RedisClient.js";
import { WordRepository } from "../../shared/infrastructure/repositories/WordRepository.js";
import { JwtService } from "../../shared/infrastructure/security/JwtService.js";
import { PasswordService } from "../../shared/infrastructure/security/PasswordService.js";
import { GeminiClient } from "../../shared/infrastructure/external/GeminiClient.js";
import { GCSClient } from "../../shared/infrastructure/external/GCSClient.js";
import { GoogleTTSClient } from "../../shared/infrastructure/external/GoogleTTSClient.js";
import { GeminiService } from "../../shared/infrastructure/external/GeminiService.js";
import { GcsFileStore } from "../../shared/infrastructure/storage/GcsFileStore.js";
import { DatabaseModule } from "./database.module.js";

/** Injection token for the readonly shared `config` object (primary config home). */
export const CONFIG = "CONFIG" as const;

/** Injection token for the `GATE_THRESHOLDS` constants (src/config/gate-thresholds.ts). */
export const GATE_THRESHOLDS_TOKEN = "GATE_THRESHOLDS" as const;

/** Injection token for the audio capability defaults (src/modules/audio/config.ts). */
export const AUDIO_CONFIG_TOKEN = "AUDIO_CONFIG" as const;

/** Injection token for the `contentUtils` module namespace. */
export const CONTENT_UTILS = "CONTENT_UTILS" as const;

@Module({
  imports: [DatabaseModule],
  providers: [
    // ── Config homes (rationalized into Nest providers) ────────────────
    { provide: CONFIG, useFactory: () => config },
    { provide: GATE_THRESHOLDS_TOKEN, useValue: GATE_THRESHOLDS },
    { provide: AUDIO_CONFIG_TOKEN, useValue: audioConfig },

    // ── Shared services ────────────────────────────────────────────────
    // Async provider: resolves the top-level await
    // (`await CacheFactory.create("default")`) before bootstrap completes.
    {
      provide: CacheService,
      useFactory: async () => await CacheFactory.create("default"),
    },
    { provide: CONTENT_UTILS, useValue: contentUtils },
    // Shared repo — implements IWordRepository; self-imports the shared Prisma
    // singleton today (additive; refactor to inject PrismaClient is a follow-up).
    { provide: WordRepository, useFactory: () => new WordRepository() },
    { provide: JwtService, useFactory: () => new JwtService() }, // reads config in constructor
    { provide: PasswordService, useFactory: () => new PasswordService() },

    // ── External clients (lazy singletons) ─────────────────────────────
    // Constructors take nothing / read `config` at call time.
    { provide: GeminiClient, useFactory: () => new GeminiClient() },
    { provide: GCSClient, useFactory: () => new GCSClient() },
    { provide: GoogleTTSClient, useFactory: () => new GoogleTTSClient() },
    {
      provide: GeminiService,
      useFactory: (client: GeminiClient) => new GeminiService(client),
      inject: [GeminiClient],
    },
    // GcsFileStore constructor-injects the GCSClient provider — no top-level
    // `new GCSClient()` in Nest land (shared/infrastructure/storage today
    // instantiated one at module scope; that scope-level construction is gone).
    {
      provide: GcsFileStore,
      useFactory: (gcsClient: GCSClient) => new GcsFileStore({ gcsClient }),
      inject: [GCSClient],
    },
  ],
  exports: [
    DatabaseModule,
    CONFIG,
    GATE_THRESHOLDS_TOKEN,
    AUDIO_CONFIG_TOKEN,
    CacheService,
    CONTENT_UTILS,
    WordRepository,
    JwtService,
    PasswordService,
    GeminiClient,
    GCSClient,
    GoogleTTSClient,
    GeminiService,
    GcsFileStore,
  ],
})
export class SharedModule implements OnApplicationShutdown {
  async onApplicationShutdown(): Promise<void> {
    // Quit the shared Redis connection (CacheService wraps redisClient; it
    // exposes no teardown of its own). Fail-open: quit() handles null client.
    await redisClient.quit();
  }
}
