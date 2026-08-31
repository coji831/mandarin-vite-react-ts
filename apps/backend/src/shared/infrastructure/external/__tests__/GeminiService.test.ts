/**
 * @file apps/backend/src/shared/infrastructure/external/__tests__/GeminiService.test.ts
 * @description Unit tests for `GeminiService.healthCheck` (Story 24-17 probe
 * gate). The `GeminiClient` is MOCKED — no real Gemini API, no SA credentials.
 *
 * Covers: delegation to the client's health result, the
 * `HEALTH_PROBE_EXTERNAL=false` short-circuit (returns `false` WITHOUT calling
 * the client — PR/preview environments must not make paid API calls), and the
 * client-throw → `false` degradation.
 *
 * `timeoutPromise` is mocked to a never-settling promise so the `Promise.race`
 * in `healthCheck` never leaks a 5s-later unhandled rejection into the test
 * runner (the client result settles the race first).
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../../../utils/logger", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  })),
}));

vi.mock("../../../utils/promise", () => ({
  // Never settles — so `Promise.race` is decided purely by the client result
  // and no unhandled rejection fires 5s later.
  timeoutPromise: vi.fn(() => new Promise(() => {})),
}));

import { GeminiService } from "../GeminiService.js";
import type { GeminiClient } from "../GeminiClient.js";

describe("GeminiService.healthCheck", () => {
  let service: GeminiService;
  let mockClient: { healthCheck: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockClient = { healthCheck: vi.fn() };
    service = new GeminiService(mockClient as unknown as GeminiClient);
  });

  it("returns the client's health result when the probe gate is open", async () => {
    mockClient.healthCheck.mockResolvedValue(true);
    await expect(service.healthCheck()).resolves.toBe(true);

    mockClient.healthCheck.mockResolvedValue(false);
    await expect(service.healthCheck()).resolves.toBe(false);
  });

  it("probe gate — returns false without calling the client when HEALTH_PROBE_EXTERNAL=false", async () => {
    const prev = process.env.HEALTH_PROBE_EXTERNAL;
    try {
      process.env.HEALTH_PROBE_EXTERNAL = "false";
      mockClient.healthCheck.mockResolvedValue(true);
      await expect(service.healthCheck()).resolves.toBe(false);
      expect(mockClient.healthCheck).not.toHaveBeenCalled();
    } finally {
      if (prev === undefined) {
        delete process.env.HEALTH_PROBE_EXTERNAL;
      } else {
        process.env.HEALTH_PROBE_EXTERNAL = prev;
      }
    }
  });

  it("returns false when the client health check throws", async () => {
    mockClient.healthCheck.mockRejectedValue(new Error("gemini down"));
    await expect(service.healthCheck()).resolves.toBe(false);
  });
});
