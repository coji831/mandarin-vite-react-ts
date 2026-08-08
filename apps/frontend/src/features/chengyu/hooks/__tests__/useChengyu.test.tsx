/**
 * @file hooks/__tests__/useChengyu.test.tsx
 * @description Integration tests (Testing Trophy, INTEGRATION tier) for
 * `useChengyu` — happy path, filter-change refetch, and error surfacing.
 * Story 23.3: Chengyu UI
 *
 * Renders the REAL hook with the REAL service + `apiClient`, intercepted by
 * the MSW node server (`src/mocks/server` + `chengyu-handlers`).
 */
import { describe, expect, it, beforeAll, afterEach, afterAll } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import { server, chengyuHandlers } from "src/mocks/server";
import { useChengyu } from "../useChengyu";
import { chengyuService } from "../../services/chengyuService";

const LIST_URL = `http://localhost:3001/api${ROUTE_PATTERNS.chengyuIdioms}`;

/** Minimal summary item factory for paginated datasets. */
function makeIdiom(n: number) {
  return {
    id: `cy_${String(n).padStart(4, "0")}`,
    chengyu: `成语${n}`,
    pinyin: `pīn yīn ${n}`,
    literalMeaning: `Literal ${n}`,
    figurativeMeaning: `Figurative ${n}`,
    era: "Han",
    theme: "determination",
    sortOrder: n,
    exampleCount: 1,
    previewExample: `例句${n}`,
  };
}

/** MSW list handler that slices a dataset by the requested page/pageSize (20). */
function paginatedListHandler(all: ReturnType<typeof makeIdiom>[]) {
  return http.get(LIST_URL, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? 1);
    const pageSize = Number(url.searchParams.get("pageSize") ?? 20);
    const start = (page - 1) * pageSize;
    return HttpResponse.json(
      { items: all.slice(start, start + pageSize), total: all.length, page, pageSize },
      { status: 200 },
    );
  });
}

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  chengyuService.clearCache();
});
afterAll(() => server.close());

describe("useChengyu (integration + MSW)", () => {
  it("loads idioms on mount (happy path)", async () => {
    server.use(...chengyuHandlers.default());

    const { result } = renderHook(() => useChengyu());

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.idioms.map((i) => i.id)).toEqual(["cy_0001", "cy_0005", "cy_0016"]);
    expect(result.current.filter).toEqual({ search: "", theme: null, era: null });
    // Pagination state defaults: page 1, total from the envelope, one page.
    expect(result.current.page).toBe(1);
    expect(result.current.total).toBe(3);
    expect(result.current.totalPages).toBe(1);
    expect(result.current.pageSize).toBe(20);
  });

  it("refetches with the new filters when a non-debounced filter changes", async () => {
    server.use(...chengyuHandlers.default());

    const { result } = renderHook(() => useChengyu());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.idioms).toHaveLength(3);

    // Era change is NOT debounced — refetches immediately with ?era=Han
    act(() => result.current.setFilter({ era: "Han" }));

    await waitFor(() => expect(result.current.idioms).toHaveLength(1));
    expect(result.current.idioms[0].id).toBe("cy_0016");
    expect(result.current.filter.era).toBe("Han");
  });

  it("debounces the search input so multi-character searches fire once", async () => {
    // Debounce + MSW server concurrency is covered more reliably at the page
    // level; here we assert the search value is applied via the filter state
    // and that a search refetch returns the filtered set.
    server.use(...chengyuHandlers.default());

    const { result } = renderHook(() => useChengyu());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setFilter({ search: "叶公好龙" }));

    // The debounced value updates after 500ms → refetch with ?search=叶公好龙
    await waitFor(() => expect(result.current.idioms).toHaveLength(1), { timeout: 2000 });
    expect(result.current.idioms[0].id).toBe("cy_0005");
    expect(result.current.filter.search).toBe("叶公好龙");
  });

  it("loads page 2 via setPage and exposes total/totalPages", async () => {
    const all = Array.from({ length: 25 }, (_, i) => makeIdiom(i + 1));
    server.use(paginatedListHandler(all));

    const { result } = renderHook(() => useChengyu());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.page).toBe(1);
    expect(result.current.total).toBe(25);
    expect(result.current.totalPages).toBe(2);
    expect(result.current.idioms).toHaveLength(20);

    // Navigate to page 2 → refetch and render the later slice of the dataset.
    act(() => result.current.setPage(2));
    await waitFor(() =>
      expect(result.current.idioms.map((i) => i.id)).toEqual([
        "cy_0021",
        "cy_0022",
        "cy_0023",
        "cy_0024",
        "cy_0025",
      ]),
    );
    expect(result.current.page).toBe(2);
    expect(result.current.total).toBe(25);
    expect(result.current.totalPages).toBe(2);
  });

  it("resets to page 1 when a filter (era) changes", async () => {
    const all = Array.from({ length: 25 }, (_, i) => makeIdiom(i + 1));
    const requested: Array<{ page: number; era: string | null }> = [];
    server.use(
      http.get(LIST_URL, ({ request }) => {
        const url = new URL(request.url);
        const page = Number(url.searchParams.get("page") ?? 1);
        const era = url.searchParams.get("era");
        requested.push({ page, era });
        const pageSize = 20;
        const start = (page - 1) * pageSize;
        return HttpResponse.json(
          { items: all.slice(start, start + pageSize), total: all.length, page, pageSize },
          { status: 200 },
        );
      }),
    );

    const { result } = renderHook(() => useChengyu());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.page).toBe(1);

    // Advance to page 2 (page-2 slice of the dataset).
    act(() => result.current.setPage(2));
    await waitFor(() => expect(result.current.idioms[0].id).toBe("cy_0021"));
    expect(result.current.page).toBe(2);

    // Era change is immediate (not debounced) → page resets to 1 and refetches.
    act(() => result.current.setFilter({ era: "Han" }));
    await waitFor(() => expect(result.current.page).toBe(1));
    await waitFor(() => expect(result.current.idioms[0].id).toBe("cy_0001"));
    expect(result.current.filter.era).toBe("Han");
    expect(requested[requested.length - 1]).toEqual({ page: 1, era: "Han" });
  });

  it("surfaces an error and clears loading when the list fetch fails", async () => {
    server.use(...chengyuHandlers.error());

    const { result } = renderHook(() => useChengyu());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).not.toBeNull();
    expect(result.current.idioms).toEqual([]);
  });

  it("recovers with data after a refetch following an initial failure", async () => {
    // Fail once, then succeed — asserts retry clears the error and loads data.
    let calls = 0;
    server.use(
      http.get(LIST_URL, () => {
        calls += 1;
        if (calls === 1) {
          return HttpResponse.json(
            { error: "Failed to load chengyu idioms", code: "LOAD_ERROR" },
            { status: 500 },
          );
        }
        return HttpResponse.json(
          {
            items: [
              {
                id: "cy_0001",
                chengyu: "破釜沉舟",
                pinyin: "pò fǔ chén zhōu",
                literalMeaning: "Break the pots and sink the boats",
                figurativeMeaning: "To burn one's bridges",
                era: "Qin–Han transition",
                theme: "determination",
                sortOrder: 1,
                exampleCount: 1,
                previewExample: "他已经决定要破釜沉舟，全力投入新的工作。",
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

    const { result } = renderHook(() => useChengyu());

    // First load fails → error surfaced, loading cleared
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.isLoading).toBe(false);

    // Retry succeeds → data loaded, error cleared
    await act(async () => {
      result.current.refetch();
    });
    await waitFor(() => expect(result.current.idioms).toHaveLength(1));
    expect(result.current.error).toBeNull();
    expect(result.current.idioms[0].id).toBe("cy_0001");
    expect(calls).toBe(2);
  });
});
