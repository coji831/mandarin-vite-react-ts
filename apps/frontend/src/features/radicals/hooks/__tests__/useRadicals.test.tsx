/**
 * @file useRadicals.test.tsx
 * @description Integration tests for the useRadicals hook error path (V9).
 * Story 19.1: Radicals Browser Structure
 *
 * Guards against the V9 defect: a failed `/api/v1/radicals` fetch must surface
 * `error` and clear `isLoading` so the page renders the shared ErrorScreen
 * instead of hanging in "Loading radicals…". `retry` must refetch on demand.
 */
import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "src/mocks/server";
import { useRadicals } from "../useRadicals";
import { radicalsService } from "../../services/radicalsService";

const API_RADICAL = {
  id: "rad_0001",
  glyph: "一",
  alternateGlyphs: [],
  namePinyin: "yī",
  nameChinese: "",
  meaning: "one",
  strokeCount: 1,
  isRecommended: true,
  kangxiIndex: 1,
  etymology: "",
  frequencyRank: null,
  notes: null,
  isAlsoCharacter: null,
  variants: null,
  hskCharacters: [],
};

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

afterEach(() => {
  server.resetHandlers();
  radicalsService.clearCache();
});

afterAll(() => server.close());

describe("useRadicals", () => {
  it("surfaces the error and leaves loading when the radicals fetch fails", async () => {
    server.use(
      // Full URL required — MSW does not resolve relative paths in the node test env.
      http.get("http://localhost:3001/api/v1/radicals", () =>
        HttpResponse.json(
          { error: "Failed to load radicals", code: "LOAD_ERROR" },
          { status: 500 },
        ),
      ),
    );

    const { result } = renderHook(() => useRadicals());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.error).not.toBeNull();
    expect(result.current.radicals).toEqual([]);
  });

  it("loads radicals after a retry following an initial failure", async () => {
    let calls = 0;
    server.use(
      http.get("http://localhost:3001/api/v1/radicals", () => {
        calls += 1;
        if (calls === 1) {
          return HttpResponse.json(
            { error: "Failed to load radicals", code: "LOAD_ERROR" },
            { status: 500 },
          );
        }
        return HttpResponse.json([API_RADICAL]);
      }),
    );

    const { result } = renderHook(() => useRadicals());

    // First load fails → error surfaced
    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });
    expect(result.current.isLoading).toBe(false);

    // Retry succeeds → data loaded, error cleared
    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.radicals).toHaveLength(1);
    expect(result.current.radicals[0].glyph).toBe("一");
    expect(calls).toBe(2);
  });
});
