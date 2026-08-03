/**
 * @file shared/hooks/__tests__/usePinyinCharacterMap.test.tsx
 * @description Hook tests for the shared pinyin→Hanzi map hook (integration
 * tier: hook + MSW against the real service endpoint).
 *
 * Public API under test: `{ charMap, isLoading, error }`.
 */

import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { server } from "src/mocks/server";
import { __resetPinyinCharacterMapCache } from "shared/services";
import { usePinyinCharacterMap } from "../usePinyinCharacterMap";

const CHAR_MAP_URL = "http://localhost:3001/api/v1/foundations/data/pinyin-character-map";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  __resetPinyinCharacterMapCache();
});
afterAll(() => server.close());

describe("usePinyinCharacterMap", () => {
  it("returns the resolved charMap and clears loading/error", async () => {
    server.use(http.get(CHAR_MAP_URL, () => HttpResponse.json({ ba: "八" })));

    const { result } = renderHook(() => usePinyinCharacterMap());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.charMap).toBeNull();

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.charMap).toEqual({ ba: "八" });
    expect(result.current.error).toBeNull();
  });

  it("returns error + null charMap on failure (non-fatal)", async () => {
    server.use(http.get(CHAR_MAP_URL, () => HttpResponse.json({ error: "boom" }, { status: 500 })));

    const { result } = renderHook(() => usePinyinCharacterMap());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.charMap).toBeNull();
    expect(result.current.error).not.toBeNull();
  });
});
