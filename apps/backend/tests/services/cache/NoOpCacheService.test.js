// apps/backend/tests/services/cache/NoOpCacheService.test.js
// Unit tests for NoOpCacheService

import { describe, test, expect, beforeEach } from "vitest";
import { NoOpCacheService } from "../../../src/infrastructure/cache/NoOpCacheService.js";

describe("NoOpCacheService", () => {
  let cacheService;
  let originalWarn;
  let warnCalls;

  beforeEach(() => {
    // Capture console.warn calls
    warnCalls = [];
    originalWarn = console.warn;
    console.warn = (...args) => warnCalls.push(args);

    cacheService = new NoOpCacheService();
  });

  afterEach(() => {
    console.warn = originalWarn;
  });

  test("should log CACHE_DISABLED warning on initialization", () => {
    expect(warnCalls.length).toBeGreaterThan(0);
    expect(warnCalls[0][0]).toContain("CACHE_DISABLED");
  });

  describe("get()", () => {
    test("should always return null", async () => {
      const value = await cacheService.get("any-key");
      expect(value).toBeNull();
    });
  });

  describe("set()", () => {
    test("should not throw and complete successfully", async () => {
      await expect(cacheService.set("key", "value", 60)).resolves.toBeUndefined();
    });
  });

  describe("delete()", () => {
    test("should not throw and complete successfully", async () => {
      await expect(cacheService.delete("key")).resolves.toBeUndefined();
    });
  });

  describe("clear()", () => {
    test("should always return 0", async () => {
      const deletedCount = await cacheService.clear("pattern:*");
      expect(deletedCount).toBe(0);
    });
  });

  describe("getMulti()", () => {
    test("should always return empty Map", async () => {
      const results = await cacheService.getMulti(["key1", "key2", "key3"]);
      expect(results).toBeInstanceOf(Map);
      expect(results.size).toBe(0);
    });
  });

  test("operations should be synchronous no-ops", async () => {
    const startTime = Date.now();

    await cacheService.set("key1", "value1", 60);
    await cacheService.get("key1");
    await cacheService.delete("key1");
    await cacheService.clear("*");
    await cacheService.getMulti(["key1", "key2"]);

    const endTime = Date.now();
    const duration = endTime - startTime;

    // All operations should complete nearly instantly (<10ms)
    expect(duration).toBeLessThan(10);
  });
});
