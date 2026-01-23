// apps/backend/tests/services/cache/RedisCacheService.test.js
// Unit tests for RedisCacheService using ioredis-mock

import { describe, test, expect, beforeEach, afterEach } from "vitest";
import RedisMock from "ioredis-mock";
import { RedisCacheService } from "../../../src/infrastructure/cache/RedisCacheService.js";

describe("RedisCacheService", () => {
  let redisMock;
  let cacheService;

  beforeEach(() => {
    // Create fresh mock Redis instance for each test
    redisMock = new RedisMock();
    cacheService = new RedisCacheService(redisMock);
  });

  afterEach(async () => {
    // Clean up
    await redisMock.flushall();
    redisMock.disconnect();
  });

  describe("set() and get()", () => {
    test("should store and retrieve string values", async () => {
      await cacheService.set("test:key", "test-value", 60);
      const value = await cacheService.get("test:key");
      expect(value).toBe("test-value");
    });

    test("should store and retrieve object values", async () => {
      const obj = { foo: "bar", num: 42 };
      await cacheService.set("test:obj", obj, 60);
      const value = await cacheService.get("test:obj");
      expect(JSON.parse(value)).toEqual(obj);
    });

    test("should return null for non-existent keys", async () => {
      const value = await cacheService.get("non-existent");
      expect(value).toBeNull();
    });

    // Note: TTL expiration is difficult to test with ioredis-mock
    // In production, Redis handles TTL natively
  });

  describe("delete()", () => {
    test("should remove existing keys", async () => {
      await cacheService.set("test:delete", "value", 60);
      await cacheService.delete("test:delete");

      const value = await cacheService.get("test:delete");
      expect(value).toBeNull();
    });

    test("should not throw on non-existent keys", async () => {
      await expect(cacheService.delete("non-existent")).resolves.not.toThrow();
    });
  });

  describe("clear()", () => {
    test("should remove keys matching pattern", async () => {
      // Set multiple keys
      await cacheService.set("tts:key1", "value1", 60);
      await cacheService.set("tts:key2", "value2", 60);
      await cacheService.set("conv:key3", "value3", 60);

      // Clear tts:* pattern
      const deletedCount = await cacheService.clear("tts:*");

      expect(deletedCount).toBe(2);
      expect(await cacheService.get("tts:key1")).toBeNull();
      expect(await cacheService.get("tts:key2")).toBeNull();
      expect(await cacheService.get("conv:key3")).toBe("value3"); // Should remain
    });

    test("should return 0 when no keys match pattern", async () => {
      const deletedCount = await cacheService.clear("nonexistent:*");
      expect(deletedCount).toBe(0);
    });
  });

  describe("getMulti()", () => {
    test("should retrieve multiple existing keys", async () => {
      await cacheService.set("key1", "value1", 60);
      await cacheService.set("key2", "value2", 60);
      await cacheService.set("key3", "value3", 60);

      const results = await cacheService.getMulti(["key1", "key2", "key3"]);

      expect(results.size).toBe(3);
      expect(results.get("key1")).toBe("value1");
      expect(results.get("key2")).toBe("value2");
      expect(results.get("key3")).toBe("value3");
    });

    test("should only return existing keys", async () => {
      await cacheService.set("key1", "value1", 60);
      // key2 doesn't exist
      await cacheService.set("key3", "value3", 60);

      const results = await cacheService.getMulti(["key1", "key2", "key3"]);

      expect(results.size).toBe(2);
      expect(results.get("key1")).toBe("value1");
      expect(results.has("key2")).toBe(false);
      expect(results.get("key3")).toBe("value3");
    });

    test("should return empty Map for empty key array", async () => {
      const results = await cacheService.getMulti([]);
      expect(results.size).toBe(0);
    });
  });

  describe("error handling", () => {
    test("should return null on Redis get() error", async () => {
      // Force an error by disconnecting
      redisMock.disconnect();

      const value = await cacheService.get("test:key");
      expect(value).toBeNull();
    });

    test("should not throw on Redis set() error", async () => {
      redisMock.disconnect();

      await expect(cacheService.set("test:key", "value", 60)).resolves.not.toThrow();
    });

    test("should not throw on Redis delete() error", async () => {
      redisMock.disconnect();

      await expect(cacheService.delete("test:key")).resolves.not.toThrow();
    });

    test("should return 0 on Redis clear() error", async () => {
      redisMock.disconnect();

      const deletedCount = await cacheService.clear("test:*");
      expect(deletedCount).toBe(0);
    });

    test("should return empty Map on Redis getMulti() error", async () => {
      redisMock.disconnect();

      const results = await cacheService.getMulti(["key1", "key2"]);
      expect(results.size).toBe(0);
    });
  });
});
