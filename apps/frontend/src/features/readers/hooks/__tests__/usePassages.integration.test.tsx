/**
 * @file hooks/__tests__/usePassages.integration.test.tsx
 * @description Integration test (Testing Trophy, INTEGRATION tier) — hook + MSW.
 *
 * Unlike `usePassages.test.ts` (which mocks the service layer), this test lets
 * the real `passageService` + `apiClient` make the request and intercepts it
 * with the MSW node server. This proves the whole wiring: hook → service →
 * axios → network layer.
 *
 * Story 21.4: Reading UI + LexicalHub Phase 1
 */
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { server } from "src/mocks/server";
import { usePassages } from "../usePassages";

const PASSAGES_URL = "http://localhost:3001/api/v1/readers/passages";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const SAMPLE_PASSAGES = [
  { id: "p1", title: "小猫的一天", hskLevel: 1, knownWordRatio: 92, isBookmarked: false },
  { id: "p2", title: "我的学校", hskLevel: 2, knownWordRatio: 80, isBookmarked: true },
];

describe("usePassages (integration + MSW)", () => {
  it("loads passages from the API: loading → success", async () => {
    server.use(
      http.get(PASSAGES_URL, () =>
        // passageService unwraps `response.data.data ?? response.data`
        HttpResponse.json({ data: SAMPLE_PASSAGES }),
      ),
    );

    const { result } = renderHook(() => usePassages());

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.passages).toEqual(SAMPLE_PASSAGES);
    expect(result.current.isEmpty).toBe(false);
    expect(result.current.hasError).toBe(false);
  });

  it("sets hasError when the API returns a server error", async () => {
    server.use(
      http.get(PASSAGES_URL, () =>
        HttpResponse.json({ error: "Failed to load passages" }, { status: 500 }),
      ),
    );

    const { result } = renderHook(() => usePassages());

    await waitFor(() => expect(result.current.hasError).toBe(true));
    expect(result.current.passages).toEqual([]);
    expect(result.current.isEmpty).toBe(false);
  });
});
