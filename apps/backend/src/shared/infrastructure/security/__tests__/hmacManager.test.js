import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { HmacManager } from "../HmacManager.js";

const ORIGINAL_ACTIVE = process.env.EXAMPLES_CACHE_HMAC_KEY;
const ORIGINAL_PREV = process.env.EXAMPLES_CACHE_HMAC_KEY_PREVIOUS;

describe("HmacManager", () => {
  afterEach(() => {
    process.env.EXAMPLES_CACHE_HMAC_KEY = ORIGINAL_ACTIVE;
    process.env.EXAMPLES_CACHE_HMAC_KEY_PREVIOUS = ORIGINAL_PREV;
  });

  it("derivation is deterministic for same inputs", () => {
    process.env.EXAMPLES_CACHE_HMAC_KEY = "active-secret-123";
    const m = new HmacManager();
    const a = m.deriveKey("hello", 1, "zh");
    const b = m.deriveKey("hello", 1, "zh");
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it("supports dual-key reads: previous vs active produce different digests", () => {
    process.env.EXAMPLES_CACHE_HMAC_KEY = "active-secret-1";
    process.env.EXAMPLES_CACHE_HMAC_KEY_PREVIOUS = "prev-secret-2";
    const m = new HmacManager();
    const active = m.deriveKey("world", 2, "zh", "active");
    const prev = m.deriveKey("world", 2, "zh", "previous");
    expect(active).not.toBe(prev);
    expect(active).toMatch(/^[0-9a-f]{64}$/);
    expect(prev).toMatch(/^[0-9a-f]{64}$/);
  });

  it("throws if EXAMPLES_CACHE_HMAC_KEY is missing at instantiation", () => {
    delete process.env.EXAMPLES_CACHE_HMAC_KEY;
    delete process.env.EXAMPLES_CACHE_HMAC_KEY_PREVIOUS;
    expect(() => new HmacManager()).toThrow();
  });
});
