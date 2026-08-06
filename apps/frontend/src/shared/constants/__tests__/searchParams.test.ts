/**
 * @file shared/constants/__tests__/searchParams.test.ts
 * @description Unit tests for the shared search-param URL builders
 * (Story 22.5). Covers: `withSearchParams` omit/default behavior and
 * `buildSearchParams` merge/omit/replaceAll/non-mutation semantics.
 */
import { describe, it, expect } from "vitest";
import { buildSearchParams, withSearchParams } from "../searchParams";

describe("withSearchParams", () => {
  it("appends query params to a bare path", () => {
    expect(withSearchParams("/practices/quiz", { type: "ime-simulator" })).toBe(
      "/practices/quiz?type=ime-simulator",
    );
  });

  it("omits null/undefined/empty values (canonical bare URL)", () => {
    expect(
      withSearchParams("/learn/radicals", {
        view: "trees",
        mode: null,
        q: undefined,
        page: "",
      }),
    ).toBe("/learn/radicals?view=trees");
  });

  it("returns the bare path when params is empty", () => {
    expect(withSearchParams("/learn/foundations", {})).toBe("/learn/foundations");
  });

  it("returns the bare path when every value is omitted", () => {
    expect(withSearchParams("/learn/foundations", { tab: null })).toBe("/learn/foundations");
  });

  it("appends with & when the path already has a query string", () => {
    expect(withSearchParams("/learn/foundations?tab=tones", { q: "ai" })).toBe(
      "/learn/foundations?tab=tones&q=ai",
    );
  });

  it("stringifies boolean and numeric values", () => {
    expect(withSearchParams("/test", { phase: 3, mode: false })).toBe("/test?phase=3&mode=false");
  });
});

describe("buildSearchParams", () => {
  it("merges updates onto current, preserving existing params", () => {
    const result = buildSearchParams(new URLSearchParams("?tab=tones&page=2"), { view: "trees" });
    expect(result.toString()).toBe("tab=tones&page=2&view=trees");
  });

  it("omits null/undefined/empty updates (removes keys from current)", () => {
    const result = buildSearchParams(new URLSearchParams("?tab=tones&view=trees&page=2"), {
      tab: null,
      view: undefined,
      q: "",
    });
    expect(result.toString()).toBe("page=2");
  });

  it("does not mutate the baseline URLSearchParams", () => {
    const current = new URLSearchParams("?tab=tones");
    const result = buildSearchParams(current, { view: "trees" });
    expect(current.toString()).toBe("tab=tones");
    expect(result).not.toBe(current);
  });

  it("replaceAll drops existing params before applying updates", () => {
    const result = buildSearchParams(
      new URLSearchParams("?tab=tones&page=2"),
      { view: "trees" },
      { replaceAll: true },
    );
    expect(result.toString()).toBe("view=trees");
  });

  it("returns an empty search when all updates are omitted from an empty baseline", () => {
    const result = buildSearchParams(new URLSearchParams(), { tab: null });
    expect(result.toString()).toBe("");
  });
});
