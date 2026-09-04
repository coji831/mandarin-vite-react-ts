/**
 * @file apps/backend/src/nest/shared/__tests__/shared-module.providers.test.ts
 * @description Unit tests for Story 24-4 — `SharedModule`/`DatabaseModule`
 * async providers + graceful shutdown.
 *
 * Covers:
 *   - `CacheService` resolves via the async `useFactory` before bootstrap
 *     completes (`Test.compile()` awaits async providers — a rejected factory
 *     fails compilation).
 *   - `PrismaClient` is a singleton (constructed exactly once per module
 *     graph) via the Prisma 7 CJS-only + `PrismaPg` connection-string factory.
 *   - External clients (`GCSClient`/`GeminiClient`/`GoogleTTSClient`/
 *     `GeminiService`) + `GcsFileStore` resolve as lazy-singleton providers;
 *     `GcsFileStore` delegates to the INJECTED `GCSClient` (no top-level
 *     `new GCSClient()` in Nest land).
 *   - The three config homes (`config`, `GATE_THRESHOLDS`, `audioConfig`) are
 *     exposed as providers.
 *   - Graceful shutdown: `DatabaseModule.onApplicationShutdown` →
 *     `PrismaClient.$disconnect()`; `SharedModule.onApplicationShutdown` →
 *     `redisClient.quit()`.
 *
 * Hermeticity: `REDIS_URL` is emptied BEFORE the shared config module is
 * evaluated so `CacheFactory.create("default")` runs in no-op mode (no real
 * Redis) and the async provider resolves instantly. `DATABASE_URL` falls back
 * so `PrismaClient` construction stays lazy (no connection is opened). JWT
 * secrets fall back so `JwtService`'s constructor does not throw. The modules
 * under test are imported DYNAMICALLY (after the env stubs) so the module
 * singletons `cacheConfig`/`config` evaluate against the stubbed env.
 */

import { describe, it, expect, vi } from "vitest";
import { Test } from "@nestjs/testing";

// ── Hermetic env — MUST run before any module under test is evaluated ──────
process.env.REDIS_URL = ""; // no-op cache → async CacheService provider is instant
process.env.DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://test:test@localhost:5432/test"; // lazy, no connect
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-jwt-secret-for-unit-tests";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "test-jwt-refresh-secret";

// Dynamic imports AFTER the env stubs (ESM evaluates static imports first).
const { DatabaseModule, PrismaClient } = await import("../database.module.js");
const { SharedModule, CONFIG, CONTENT_UTILS, GATE_THRESHOLDS_TOKEN, AUDIO_CONFIG_TOKEN } =
  await import("../shared.module.js");
const { GATE_THRESHOLDS } = await import("../../../config/gate-thresholds.js");
const { audioConfig } = await import("../../../modules/audio/config.js");
const contentUtils = await import("../../../shared/utils/contentUtils.js");
const { CacheService } = await import("../../../shared/infrastructure/cache/CacheService.js");
const { GCSClient } = await import("../../../shared/infrastructure/external/GCSClient.js");
const { GeminiClient } = await import("../../../shared/infrastructure/external/GeminiClient.js");
const { GoogleTTSClient } =
  await import("../../../shared/infrastructure/external/GoogleTTSClient.js");
const { GeminiService } = await import("../../../shared/infrastructure/external/GeminiService.js");
const { GcsFileStore } = await import("../../../shared/infrastructure/storage/GcsFileStore.js");
const { redisClient } = await import("../../../shared/infrastructure/redis/RedisClient.js");

/** A PrismaClient-shaped mock for tests that don't exercise the real factory. */
function mockPrismaClient(): { $disconnect: ReturnType<typeof vi.fn> } {
  return { $disconnect: vi.fn().mockResolvedValue(undefined) };
}

describe("SharedModule async providers (story 24-4)", () => {
  it("resolves CacheService via the async useFactory before bootstrap completes", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [SharedModule] })
      .overrideProvider(PrismaClient)
      .useValue(mockPrismaClient())
      .compile(); // compile() awaits async providers — throws if the factory rejects

    const cache = moduleRef.get(CacheService);
    expect(cache).toBeInstanceOf(CacheService);
    await moduleRef.close();
  });

  it("exposes the three config homes as providers", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [SharedModule] })
      .overrideProvider(PrismaClient)
      .useValue(mockPrismaClient())
      .compile();

    const configValue = moduleRef.get<{ databaseUrl: string }>(CONFIG);
    expect(configValue.databaseUrl).toBe(process.env.DATABASE_URL);
    expect(moduleRef.get<typeof GATE_THRESHOLDS>(GATE_THRESHOLDS_TOKEN)).toBe(GATE_THRESHOLDS);
    expect(moduleRef.get<typeof audioConfig>(AUDIO_CONFIG_TOKEN)).toBe(audioConfig);
    expect(moduleRef.get<typeof contentUtils>(CONTENT_UTILS).stripToneMarks).toBeTypeOf("function");
    expect(moduleRef.get<typeof contentUtils>(CONTENT_UTILS).shuffleArray).toBeTypeOf("function");
    await moduleRef.close();
  });

  it("constructs PrismaClient exactly once (singleton) via the Prisma 7 factory", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [DatabaseModule] }).compile();

    const first = moduleRef.get(PrismaClient);
    const second = moduleRef.get(PrismaClient);
    expect(first).toBe(second);
    expect(typeof first.$disconnect).toBe("function");
    await moduleRef.close();
  });

  it("exposes external clients as lazy-singleton providers and injects GCSClient into GcsFileStore", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [SharedModule] })
      .overrideProvider(PrismaClient)
      .useValue(mockPrismaClient())
      .compile();

    // Lazy singletons: resolving does not require GCS/TTS/Gemini credentials —
    // the clients read `config` at call time, not construction.
    const gcsClient = moduleRef.get(GCSClient);
    expect(gcsClient).toBeInstanceOf(GCSClient);
    expect(moduleRef.get(GeminiClient)).toBeInstanceOf(GeminiClient);
    expect(moduleRef.get(GoogleTTSClient)).toBeInstanceOf(GoogleTTSClient);
    expect(moduleRef.get(GeminiService)).toBeInstanceOf(GeminiService);

    const store = moduleRef.get(GcsFileStore);
    expect(store).toBeInstanceOf(GcsFileStore);

    // GcsFileStore delegates to the INJECTED GCSClient — no top-level
    // `new GCSClient()` in Nest land.
    const fileExists = vi.spyOn(gcsClient, "fileExists").mockResolvedValue(false);
    await store.exists("tts/test.mp3");
    expect(fileExists).toHaveBeenCalledWith("tts/test.mp3", undefined);
    fileExists.mockRestore();

    await moduleRef.close();
  });
});

describe("graceful shutdown (story 24-4, R2 AC)", () => {
  it("DatabaseModule disconnects PrismaClient on application shutdown", async () => {
    const disconnect = vi.fn().mockResolvedValue(undefined);
    const moduleRef = await Test.createTestingModule({ imports: [DatabaseModule] })
      .overrideProvider(PrismaClient)
      .useValue({ $disconnect: disconnect })
      .compile();

    await moduleRef.close(); // triggers onApplicationShutdown

    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it("SharedModule quits the Redis client on application shutdown", async () => {
    const quit = vi.spyOn(redisClient, "quit").mockResolvedValue(undefined);
    const moduleRef = await Test.createTestingModule({ imports: [SharedModule] })
      .overrideProvider(PrismaClient)
      .useValue(mockPrismaClient())
      .compile();

    await moduleRef.close(); // triggers onApplicationShutdown

    expect(quit).toHaveBeenCalledTimes(1);
    quit.mockRestore();
  });
});
