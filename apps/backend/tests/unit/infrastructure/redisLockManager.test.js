import { describe, it, expect, vi } from "vitest";
import { RedisLockManager } from "../../../src/infrastructure/cache/RedisLockManager.js";

describe("RedisLockManager", () => {
  it("acquire() returns true when SET returns OK", async () => {
    const mockRedis = { set: vi.fn().mockResolvedValue("OK") };
    const lm = new RedisLockManager(mockRedis);
    const ok = await lm.acquire("cacheKey1", "owner-1", 3000);
    expect(mockRedis.set).toHaveBeenCalled();
    expect(ok).toBe(true);
  });

  it("acquire() returns false when lock is held (SET returns null)", async () => {
    const mockRedis = { set: vi.fn().mockResolvedValue(null) };
    const lm = new RedisLockManager(mockRedis);
    const ok = await lm.acquire("cacheKey2", "owner-2", 3000);
    expect(ok).toBe(false);
  });

  it("release() returns true when eval deletes key", async () => {
    const mockRedis = { eval: vi.fn().mockResolvedValue(1) };
    const lm = new RedisLockManager(mockRedis);
    const released = await lm.release("cacheKey3", "owner-3");
    expect(mockRedis.eval).toHaveBeenCalled();
    expect(released).toBe(true);
  });

  it("release() returns false when owner mismatch (eval returns 0)", async () => {
    const mockRedis = { eval: vi.fn().mockResolvedValue(0) };
    const lm = new RedisLockManager(mockRedis);
    const released = await lm.release("cacheKey4", "owner-4");
    expect(released).toBe(false);
  });

  it("acquire() handles Redis errors and returns false", async () => {
    const mockRedis = { set: vi.fn().mockRejectedValue(new Error("conn error")) };
    const lm = new RedisLockManager(mockRedis);
    const ok = await lm.acquire("cacheKey5", "owner-5", 3000);
    expect(ok).toBe(false);
  });
});
