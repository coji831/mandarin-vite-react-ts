/**
 * @file shared/api/__tests__/errors.test.ts
 * @description Unit tests for the shared auth-failure classifier + normalizer.
 * Bug 2: isAuthFailure extracted from axiosClient — these pin the exact
 * predicate so the interceptor and feature gates (ReviewView upsell) agree.
 */
import { describe, it, expect } from "vitest";
import type { NormalizedError } from "@mandarin/shared-types";
import { isAuthFailure, toNormalizedError } from "../errors";

/** Build a NormalizedError that mimics the axiosClient interceptor output. */
function makeError(status?: number, responseCode?: string): NormalizedError {
  return {
    message: status ? "Request failed with status code " + status : "Network Error",
    status,
    code: status === undefined ? "ERR_NETWORK" : undefined,
    originalError: {
      name: "AxiosError",
      message: "Request failed",
      response: status !== undefined ? { status, data: { code: responseCode } } : undefined,
    },
  };
}

describe("isAuthFailure", () => {
  it("returns true for 401 (missing/expired token)", () => {
    expect(isAuthFailure(makeError(401))).toBe(true);
  });

  it("returns true for 403 with INVALID_TOKEN code (tampered token)", () => {
    expect(isAuthFailure(makeError(403, "INVALID_TOKEN"))).toBe(true);
  });

  it("returns false for 403 with any other code", () => {
    expect(isAuthFailure(makeError(403, "FORBIDDEN"))).toBe(false);
  });

  it("returns false for 403 with no code", () => {
    expect(isAuthFailure(makeError(403, undefined))).toBe(false);
  });

  it("returns false for 500 server errors", () => {
    expect(isAuthFailure(makeError(500))).toBe(false);
  });

  it("returns false for network errors (no status)", () => {
    expect(isAuthFailure(makeError(undefined))).toBe(false);
  });

  it("returns false for non-object inputs", () => {
    expect(isAuthFailure(null)).toBe(false);
    expect(isAuthFailure(undefined)).toBe(false);
    expect(isAuthFailure("string error")).toBe(false);
    expect(isAuthFailure(42)).toBe(false);
  });
});

describe("toNormalizedError", () => {
  it("passes through a NormalizedError-shaped object", () => {
    const normalized = makeError(401);
    expect(toNormalizedError(normalized)).toBe(normalized);
  });

  it("wraps a plain Error using its message", () => {
    const result = toNormalizedError(new Error("boom"));
    expect(result.message).toBe("boom");
    expect(result.status).toBeUndefined();
  });

  it("uses fallback message for non-object / non-Error input", () => {
    expect(toNormalizedError(undefined).message).toBe("An unexpected error occurred");
    expect(toNormalizedError(42, "custom fallback").message).toBe("custom fallback");
  });
});
