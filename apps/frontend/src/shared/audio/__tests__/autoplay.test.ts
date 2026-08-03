/**
 * @file shared/audio/__tests__/autoplay.test.ts
 * @description Unit tests for the autoplay-policy wrapper.
 *
 * `getAutoplayPolicy` takes an injected getter (testable without touching
 * `navigator`); `detectAutoplayPolicy` is the feature-detected default that
 * falls back to "unknown" when `navigator.getAutoplayPolicy` is absent.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { detectAutoplayPolicy, getAutoplayPolicy } from "../autoplay";

describe("getAutoplayPolicy (injected getter)", () => {
  it("maps each policy value through the injected getter", () => {
    expect(getAutoplayPolicy(() => "allowed")).toBe("allowed");
    expect(getAutoplayPolicy(() => "allowed-muted")).toBe("allowed-muted");
    expect(getAutoplayPolicy(() => "disallowed")).toBe("disallowed");
    expect(getAutoplayPolicy(() => "unknown")).toBe("unknown");
  });

  it("uses the default feature-detected getter when none is provided", () => {
    expect(getAutoplayPolicy()).toBe("unknown"); // jsdom: no getAutoplayPolicy
  });
});

describe("detectAutoplayPolicy (navigator)", () => {
  afterEach(() => {
    // jsdom does not define getAutoplayPolicy — ensure a clean slate.
    delete (navigator as { getAutoplayPolicy?: unknown }).getAutoplayPolicy;
  });

  it("returns 'unknown' when the API is absent (older Safari/Chrome)", () => {
    expect(detectAutoplayPolicy()).toBe("unknown");
  });

  it("returns the mediaelement policy when the API is present", () => {
    const getAutoplayPolicy = vi.fn(() => "disallowed" as const);
    Object.defineProperty(navigator, "getAutoplayPolicy", {
      writable: true,
      configurable: true,
      value: getAutoplayPolicy,
    });
    expect(detectAutoplayPolicy()).toBe("disallowed");
    expect(getAutoplayPolicy).toHaveBeenCalledWith("mediaelement");
  });

  it("supports the per-element variant", () => {
    const getAutoplayPolicy = vi.fn(() => "allowed-muted" as const);
    Object.defineProperty(navigator, "getAutoplayPolicy", {
      writable: true,
      configurable: true,
      value: getAutoplayPolicy,
    });
    const element = {} as HTMLMediaElement;
    expect(detectAutoplayPolicy(element)).toBe("allowed-muted");
    expect(getAutoplayPolicy).toHaveBeenCalledWith(element);
  });

  it("falls back to 'unknown' when the API throws", () => {
    Object.defineProperty(navigator, "getAutoplayPolicy", {
      writable: true,
      configurable: true,
      value: vi.fn(() => {
        throw new Error("boom");
      }),
    });
    expect(detectAutoplayPolicy()).toBe("unknown");
  });

  it("falls back to 'unknown' when the API returns an unexpected value", () => {
    Object.defineProperty(navigator, "getAutoplayPolicy", {
      writable: true,
      configurable: true,
      value: vi.fn(() => "something-else" as never),
    });
    expect(detectAutoplayPolicy()).toBe("unknown");
  });
});
