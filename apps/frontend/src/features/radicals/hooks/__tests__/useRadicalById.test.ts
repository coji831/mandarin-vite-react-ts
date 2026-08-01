/**
 * @file hooks/__tests__/useRadicalById.test.ts
 * @description Tests for useRadicalById hook — the RadicalHub self-fetch path.
 * Story 19.2: Radical Detail Card
 * Story 21.x (visual wave): RadicalHub self-fetch.
 *
 * Uses the shared MSW node server with full URLs (like useRadicals.test.tsx).
 */
import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "src/mocks/server";
import { useRadicalById } from "../useRadicalById";
import { radicalsService } from "../../services/radicalsService";

const API_RADICAL = {
  id: "rad_0001",
  glyph: "一",
  alternateGlyphs: [],
  namePinyin: "yī",
  nameChinese: "一",
  meaning: "one",
  strokeCount: 1,
  isRecommended: true,
  kangxiIndex: 1,
  etymology: "Pictograph of a single horizontal stroke",
  frequencyRank: 1,
  notes: null,
  isAlsoCharacter: true,
  variants: null,
  hskCharacters: [],
};

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

afterEach(() => {
  server.resetHandlers();
  radicalsService.clearCache();
});

afterAll(() => server.close());

describe("useRadicalById", () => {
  it("returns idle state when id is null (Storybook mode)", () => {
    const { result } = renderHook(() => useRadicalById(null));
    expect(result.current).toEqual({ data: null, isLoading: false, isError: false });
  });

  it("loads a radical by id", async () => {
    server.use(
      http.get("http://localhost:3001/api/v1/radicals/rad_0001", () =>
        HttpResponse.json(API_RADICAL),
      ),
    );

    const { result } = renderHook(() => useRadicalById("rad_0001"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isError).toBe(false);
    expect(result.current.data?.glyph).toBe("一");
    expect(result.current.data?.name_pinyin).toBe("yī");
  });

  it("surfaces the error when the fetch fails", async () => {
    server.use(
      http.get("http://localhost:3001/api/v1/radicals/rad_0001", () =>
        HttpResponse.json({ error: "Failed to load radicals" }, { status: 500 }),
      ),
    );

    const { result } = renderHook(() => useRadicalById("rad_0001"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isError).toBe(true);
    expect(result.current.data).toBeNull();
  });
});
