/**
 * @file shared/services/pinyin/__tests__/pinyinCharacterMapService.test.ts
 * @description Unit tests for the shared pinyin→Hanzi map service — specifically
 * the module-level cached-promise DEDUPE (two callers, one fetch) and the
 * clear-on-failure retry behavior.
 */

import { http, HttpResponse } from "msw";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { server } from "src/mocks/server";
import { fetchPinyinCharacterMap, __resetPinyinCharacterMapCache } from "shared/services";

const CHAR_MAP_URL = "http://localhost:3001/api/v1/foundations/data/pinyin-character-map";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  __resetPinyinCharacterMapCache();
});
afterAll(() => server.close());

describe("pinyinCharacterMapService", () => {
  it("fetches the pinyin→Hanzi map from the backend route", async () => {
    server.use(http.get(CHAR_MAP_URL, () => HttpResponse.json({ ba: "八" })));
    const map = await fetchPinyinCharacterMap();
    expect(map).toEqual({ ba: "八" });
  });

  it("dedupes concurrent callers to ONE fetch (module-level cached promise)", async () => {
    let fetchCount = 0;
    server.use(
      http.get(CHAR_MAP_URL, () => {
        fetchCount += 1;
        return HttpResponse.json({ ba: "八" });
      }),
    );

    const [a, b] = await Promise.all([fetchPinyinCharacterMap(), fetchPinyinCharacterMap()]);
    expect(a).toEqual({ ba: "八" });
    expect(b).toEqual({ ba: "八" });
    expect(fetchCount).toBe(1); // two callers, one in-flight fetch
  });

  it("reuses the memoized promise across sequential calls (no refetch)", async () => {
    let fetchCount = 0;
    server.use(
      http.get(CHAR_MAP_URL, () => {
        fetchCount += 1;
        return HttpResponse.json({ ba: "八" });
      }),
    );

    await fetchPinyinCharacterMap();
    await fetchPinyinCharacterMap();
    expect(fetchCount).toBe(1);
  });

  it("clears the cached promise after a failure so a later call retries", async () => {
    server.use(http.get(CHAR_MAP_URL, () => HttpResponse.json({ error: "boom" }, { status: 500 })));
    await expect(fetchPinyinCharacterMap()).rejects.toThrow();

    server.resetHandlers();
    server.use(http.get(CHAR_MAP_URL, () => HttpResponse.json({ ba: "八" })));
    const map = await fetchPinyinCharacterMap();
    expect(map).toEqual({ ba: "八" });
  });
});
