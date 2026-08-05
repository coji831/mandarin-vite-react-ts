/**
 * @file hooks/__tests__/useGrammar.test.tsx
 * @description Integration tests (Testing Trophy, INTEGRATION tier) for
 * `useGrammar` — happy path, filter-change refetch, and error surfacing.
 * Story 22.3: Grammar UI
 *
 * Renders the REAL hook with the REAL service + `apiClient`, intercepted by
 * the MSW node server (`src/mocks/server` + `grammar-handlers`).
 */
import { describe, expect, it, beforeAll, afterEach, afterAll } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import { server, grammarHandlers } from "src/mocks/server";
import { useGrammar } from "../useGrammar";
import { grammarService } from "../../services/grammarService";

const LIST_URL = `http://localhost:3001/api${ROUTE_PATTERNS.grammarPatterns}`;

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  grammarService.clearCache();
});
afterAll(() => server.close());

describe("useGrammar (integration + MSW)", () => {
  it("loads patterns on mount (happy path)", async () => {
    server.use(...grammarHandlers.default());

    const { result } = renderHook(() => useGrammar());

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.patterns.map((p) => p.id)).toEqual(["gr_0005", "gr_0018", "gr_0019"]);
    expect(result.current.filter).toEqual({ search: "", hskLevel: null, phase: null });
  });

  it("refetches with the new filters when the filter state changes", async () => {
    server.use(...grammarHandlers.default());

    const { result } = renderHook(() => useGrammar());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.patterns).toHaveLength(3);

    // HSK-level change is NOT debounced — refetches immediately with ?hskLevel=4
    act(() => result.current.setFilter({ hskLevel: 4 }));

    await waitFor(() => expect(result.current.patterns).toHaveLength(2));
    expect(result.current.patterns.map((p) => p.id)).toEqual(["gr_0018", "gr_0019"]);
    expect(result.current.filter.hskLevel).toBe(4);
  });

  it("surfaces an error and clears loading when the list fetch fails", async () => {
    server.use(...grammarHandlers.error());

    const { result } = renderHook(() => useGrammar());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).not.toBeNull();
    expect(result.current.patterns).toEqual([]);
  });

  it("recovers with data after a refetch following an initial failure", async () => {
    // Fail once, then succeed — asserts retry clears the error and loads data.
    let calls = 0;
    server.use(
      http.get(LIST_URL, () => {
        calls += 1;
        if (calls === 1) {
          return HttpResponse.json(
            { error: "Failed to load grammar patterns", code: "LOAD_ERROR" },
            { status: 500 },
          );
        }
        return HttpResponse.json(
          {
            items: [
              {
                id: "gr_0005",
                name: "吗 yes/no questions",
                structure: "Statement + 吗？",
                phase: 2,
                hskLevel: 1,
                sortOrder: 5,
                exampleCount: 3,
                previewExample: "你好吗？",
              },
            ],
            total: 1,
            page: 1,
            pageSize: 20,
          },
          { status: 200 },
        );
      }),
    );

    const { result } = renderHook(() => useGrammar());

    // First load fails → error surfaced, loading cleared
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.isLoading).toBe(false);

    // Retry succeeds → data loaded, error cleared
    await act(async () => {
      result.current.refetch();
    });
    await waitFor(() => expect(result.current.patterns).toHaveLength(1));
    expect(result.current.error).toBeNull();
    expect(result.current.patterns[0].id).toBe("gr_0005");
    expect(calls).toBe(2);
  });
});
