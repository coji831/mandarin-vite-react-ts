/**
 * @file shared/audio/__tests__/AudioUrlCache.test.ts
 * @description Unit tests for the session cache + in-flight dedupe.
 *
 * Phase 2 (candidates-as-data): the cache stores `PlayableSource[]` candidate
 * lists. Empty (silent-skip) lists are never cached so a later play can retry.
 */

import { describe, expect, it, vi } from "vitest";
import { AudioUrlCache } from "../AudioUrlCache";
import type { PlayableSource } from "../types";

const urlCandidates = (url: string): PlayableSource[] => [{ kind: "url", url, source: "ondemand" }];
const emptyCandidates: PlayableSource[] = [];

describe("AudioUrlCache", () => {
  it("get/set/has/evict round-trip", () => {
    const cache = new AudioUrlCache();
    expect(cache.has("word#好")).toBe(false);
    cache.set("word#好", urlCandidates("https://a.mp3"));
    expect(cache.has("word#好")).toBe(true);
    expect(cache.get("word#好")).toEqual(urlCandidates("https://a.mp3"));
    cache.evict("word#好");
    expect(cache.has("word#好")).toBe(false);
  });

  it("never caches empty (silent-skip) candidate lists (retry later can succeed)", async () => {
    const cache = new AudioUrlCache();
    const loader = vi.fn(() => Promise.resolve(emptyCandidates));
    const first = await cache.dedupe("word#好", loader);
    expect(first).toEqual(emptyCandidates);
    expect(cache.has("word#好")).toBe(false);
    // Second call re-runs the loader (nothing cached).
    await cache.dedupe("word#好", loader);
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("dedupes concurrent in-flight loads (two rapid plays → one fetch)", async () => {
    const cache = new AudioUrlCache();
    let resolveFirst!: (v: PlayableSource[]) => void;
    const loader = vi.fn(
      () =>
        new Promise<PlayableSource[]>((resolve) => {
          resolveFirst = resolve;
        }),
    );

    const p1 = cache.dedupe("word#好", loader);
    const p2 = cache.dedupe("word#好", loader);
    expect(loader).toHaveBeenCalledTimes(1);

    resolveFirst(urlCandidates("https://a.mp3"));
    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1).toEqual(urlCandidates("https://a.mp3"));
    expect(r2).toEqual(urlCandidates("https://a.mp3"));
  });

  it("serves cached hits without calling the loader again", async () => {
    const cache = new AudioUrlCache();
    const loader = vi.fn(() => Promise.resolve(urlCandidates("https://a.mp3")));
    await cache.dedupe("word#好", loader);
    const cached = await cache.dedupe("word#好", loader);
    expect(cached).toEqual(urlCandidates("https://a.mp3"));
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("evicts a broken URL so the next resolve re-fetches", async () => {
    const cache = new AudioUrlCache();
    const loader = vi.fn(() => Promise.resolve(urlCandidates("https://broken.mp3")));
    await cache.dedupe("word#好", loader);
    cache.evict("word#好");
    await cache.dedupe("word#好", loader);
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("clear() empties the cache and in-flight map", async () => {
    const cache = new AudioUrlCache();
    cache.set("a", urlCandidates("https://a.mp3"));
    cache.clear();
    expect(cache.has("a")).toBe(false);
  });
});
