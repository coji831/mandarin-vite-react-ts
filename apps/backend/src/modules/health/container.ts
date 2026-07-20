/**
 * @file modules/health/container.ts
 * @description Module-level DI container factory for the Health module.
 */
import { HealthController } from "./api/HealthController.js";
import { TtsService } from "../../shared/services/TtsService.js";
import { GeminiService } from "../../shared/services/GeminiService.js";
import type { RedisClient } from "../../shared/infrastructure/redis/RedisClient.js";

export interface HealthModuleDeps {
  geminiService: GeminiService;
  ttsService: TtsService;
  redisClient: RedisClient;
}

export function createHealthModule(deps: HealthModuleDeps) {
  // Extract raw ioredis client for HealthController's ping interface
  const rawClient = deps.redisClient.getClient();
  const redisPing = (rawClient ?? { ping: async () => "NO_REDIS" }) as {
    ping(timeout?: number): Promise<string>;
  };
  const controller = new HealthController(deps.geminiService, deps.ttsService, redisPing);
  return { controller };
}
