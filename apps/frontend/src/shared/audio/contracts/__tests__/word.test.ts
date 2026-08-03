/**
 * @file shared/audio/contracts/__tests__/word.test.ts
 * @description Unit tests for the default word contract (Phase 2).
 *
 * Pins: url/tts/empty candidate building per `WordAudioError.kind` (network/5xx
 * → tts, auth/429 → empty silent-skip); relative URL absolutization; cache +
 * dedupe; `onUrlFailed` evicts the word cache and returns `"fallback"`; and the
 * `defaultWordBehavior` shape (single strategy, lazy sources → one item).
 */

import { describe, expect, it, vi, type Mock } from "vitest";
import type { WordAudio, WordAudioRequest } from "@mandarin/shared-types";
import { AudioUrlCache } from "../../AudioUrlCache";
import { WordAudioError } from "../../../services/audio";
import { buildWordItem, buildWordPlayableItem, defaultWordBehavior, toAbsoluteUrl } from "../word";
import type { PlayableItem, PlayableSource } from "../../types";

type FetchWordAudioMock = Mock<(params: WordAudioRequest) => Promise<WordAudio>>;
type WordAudioServiceLike = { fetchWordAudio: FetchWordAudioMock };

function serviceReturning(result: WordAudio): WordAudioServiceLike {
  return { fetchWordAudio: vi.fn(async () => result) };
}

function serviceThrowing(err: unknown): WordAudioServiceLike {
  return { fetchWordAudio: vi.fn(async () => Promise.reject(err)) };
}

const freshCache = () => new AudioUrlCache();

describe("word contract — buildWordItem", () => {
  it("maps a URL response to a url candidate (absolute URL kept; absent cached → 'ondemand')", async () => {
    const service = serviceReturning({ audioUrl: "https://cdn/好.mp3", text: "好" });
    const candidates = await buildWordItem("好", { service, cache: freshCache() });
    expect(candidates).toEqual([{ kind: "url", url: "https://cdn/好.mp3", source: "ondemand" }]);
    expect(service.fetchWordAudio).toHaveBeenCalledWith({ chinese: "好" });
  });

  it("maps a cached:true response to a 'cached' url candidate", async () => {
    const service = serviceReturning({ audioUrl: "https://cdn/好.mp3", text: "好", cached: true });
    const candidates = await buildWordItem("好", { service, cache: freshCache() });
    expect(candidates).toEqual([{ kind: "url", url: "https://cdn/好.mp3", source: "cached" }]);
  });

  it("maps a cached:false response to an 'ondemand' url candidate", async () => {
    const service = serviceReturning({ audioUrl: "https://cdn/好.mp3", text: "好", cached: false });
    const candidates = await buildWordItem("好", { service, cache: freshCache() });
    expect(candidates).toEqual([{ kind: "url", url: "https://cdn/好.mp3", source: "ondemand" }]);
  });

  it("absolutizes a relative URL against the API base", async () => {
    const service = serviceReturning({ audioUrl: "/static/好.mp3", text: "好" });
    const candidates = await buildWordItem("好", { service, cache: freshCache() });
    expect(candidates).toEqual([
      { kind: "url", url: "http://localhost:3001/api/static/好.mp3", source: "ondemand" },
    ]);
  });

  it("maps a missing audioUrl to a tts candidate", async () => {
    const service = serviceReturning({ audioUrl: "", text: "好" });
    const candidates = await buildWordItem("好", { service, cache: freshCache() });
    expect(candidates).toEqual([{ kind: "tts", text: "好", lang: "zh-CN" }]);
  });

  it("maps a server (5xx) failure to a tts candidate", async () => {
    const service = serviceThrowing(new WordAudioError("server", "server", 500));
    const candidates = await buildWordItem("好", { service, cache: freshCache() });
    expect(candidates).toEqual([{ kind: "tts", text: "好", lang: "zh-CN" }]);
  });

  it("maps a network failure to a tts candidate", async () => {
    const service = serviceThrowing(new WordAudioError("network", "network"));
    const candidates = await buildWordItem("好", { service, cache: freshCache() });
    expect(candidates).toEqual([{ kind: "tts", text: "好", lang: "zh-CN" }]);
  });

  it("maps an auth (401/403) failure to empty candidates (silent skip — no TTS loop)", async () => {
    const service = serviceThrowing(new WordAudioError("auth", "auth", 401));
    const candidates = await buildWordItem("好", { service, cache: freshCache() });
    expect(candidates).toEqual([]);
  });

  it("maps a rate-limit (429) failure to empty candidates (silent skip)", async () => {
    const service = serviceThrowing(new WordAudioError("rate-limit", "rate-limit", 429));
    const candidates = await buildWordItem("好", { service, cache: freshCache() });
    expect(candidates).toEqual([]);
  });

  it("maps an unexpected error to empty candidates", async () => {
    const service = serviceThrowing(new Error("boom"));
    const candidates = await buildWordItem("好", { service, cache: freshCache() });
    expect(candidates).toEqual([]);
  });

  it("caches resolutions and dedupes concurrent loads", async () => {
    const service = serviceReturning({ audioUrl: "https://cdn/好.mp3", text: "好" });
    const cache = freshCache();
    await buildWordItem("好", { service, cache });
    await buildWordItem("好", { service, cache });
    expect(service.fetchWordAudio).toHaveBeenCalledTimes(1); // cached second time
    expect(cache.has("word#好")).toBe(true);
  });

  it("empty (silent-skip) results are NOT cached — a later play can retry", async () => {
    const service = vi
      .fn()
      .mockRejectedValueOnce(new WordAudioError("auth", "auth", 401))
      .mockResolvedValueOnce({ audioUrl: "https://cdn/好.mp3", text: "好" });
    const cache = freshCache();
    const first = await buildWordItem("好", {
      service: { fetchWordAudio: service } as WordAudioServiceLike,
      cache,
    });
    expect(first).toEqual([]);
    expect(cache.has("word#好")).toBe(false); // not cached → retry allowed
    const second = await buildWordItem("好", {
      service: { fetchWordAudio: service } as WordAudioServiceLike,
      cache,
    });
    expect(second).toEqual([{ kind: "url", url: "https://cdn/好.mp3", source: "ondemand" }]);
    expect(service).toHaveBeenCalledTimes(2);
  });
});

describe("word contract — buildWordPlayableItem", () => {
  it("builds a single PlayableItem with the candidates and title", async () => {
    const service = serviceReturning({ audioUrl: "https://cdn/好.mp3", text: "好" });
    const item = await buildWordPlayableItem("好", { service, cache: freshCache() });
    expect(item).toEqual({
      id: "好",
      candidates: [{ kind: "url", url: "https://cdn/好.mp3", source: "ondemand" }],
      title: "好",
    });
  });
});

describe("word contract — defaultWordBehavior", () => {
  it("is a single strategy with lazy sources resolving to one item", async () => {
    const service = serviceReturning({ audioUrl: "https://cdn/好.mp3", text: "好" });
    const behavior = defaultWordBehavior("好", { service, cache: freshCache() });
    expect(behavior.strategy).toBe("single");
    expect(typeof behavior.sources).toBe("function");

    const items = (await (behavior.sources as () => Promise<PlayableItem[]>)()) as PlayableItem[];
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe("好");
    expect(items[0].candidates).toEqual([
      { kind: "url", url: "https://cdn/好.mp3", source: "ondemand" },
    ]);
  });

  it("onUrlFailed evicts the word cache and returns 'fallback'", async () => {
    const cache = freshCache();
    const service = serviceReturning({ audioUrl: "https://cdn/好.mp3", text: "好" });
    await buildWordItem("好", { service, cache });
    expect(cache.has("word#好")).toBe(true);

    const behavior = defaultWordBehavior("好", { service, cache });
    const decision = behavior.onUrlFailed?.({ id: "好", candidates: [] as PlayableSource[] });
    expect(decision).toBe("fallback");
    expect(cache.has("word#好")).toBe(false); // evicted → re-resolve next play
  });
});

describe("word contract — toAbsoluteUrl", () => {
  it("passes through absolute and protocol-relative URLs", () => {
    expect(toAbsoluteUrl("https://x/y.mp3")).toBe("https://x/y.mp3");
    expect(toAbsoluteUrl("//cdn/x.mp3")).toBe("//cdn/x.mp3");
  });
});

describe("word contract — TTS-input guard (Phase 1b universalization)", () => {
  it("passes Hanzi through unchanged (fast path — resolver not consulted)", async () => {
    const service = serviceReturning({ audioUrl: "https://cdn/好.mp3", text: "好" });
    const resolveHanzi = vi.fn(() => null);
    const candidates = await buildWordItem("好", {
      service,
      cache: freshCache(),
      resolveHanzi,
    });
    expect(candidates).toEqual([{ kind: "url", url: "https://cdn/好.mp3", source: "ondemand" }]);
    expect(service.fetchWordAudio).toHaveBeenCalledWith({ chinese: "好" });
    expect(resolveHanzi).not.toHaveBeenCalled();
  });

  it('resolves pinyin "ba1" via the injected resolver and POSTs the glyph 八', async () => {
    const service = serviceReturning({ audioUrl: "https://cdn/八.mp3", text: "八" });
    const candidates = await buildWordItem("ba1", {
      service,
      cache: freshCache(),
      resolveHanzi: () => "八",
    });
    expect(service.fetchWordAudio).toHaveBeenCalledWith({ chinese: "八" });
    expect(candidates).toEqual([{ kind: "url", url: "https://cdn/八.mp3", source: "ondemand" }]);
  });

  it("silently skips pinyin when the resolver returns null (no POST, [] candidates)", async () => {
    const service = serviceReturning({ audioUrl: "https://cdn/八.mp3", text: "八" });
    const candidates = await buildWordItem("ba1", {
      service,
      cache: freshCache(),
      resolveHanzi: () => null,
    });
    expect(candidates).toEqual([]);
    expect(service.fetchWordAudio).not.toHaveBeenCalled();
  });

  it("silently skips pinyin when no resolver is injected", async () => {
    const service = serviceReturning({ audioUrl: "https://cdn/八.mp3", text: "八" });
    const candidates = await buildWordItem("ba1", { service, cache: freshCache() });
    expect(candidates).toEqual([]);
    expect(service.fetchWordAudio).not.toHaveBeenCalled();
  });

  it("textIsChinese:true bypasses Hanzi detection (treats text as Chinese as-is)", async () => {
    const service = serviceReturning({ audioUrl: "https://cdn/x.mp3", text: "x" });
    const resolveHanzi = vi.fn(() => "八");
    const candidates = await buildWordItem("ba1", {
      service,
      cache: freshCache(),
      textIsChinese: true,
      resolveHanzi,
    });
    expect(candidates).toEqual([{ kind: "url", url: "https://cdn/x.mp3", source: "ondemand" }]);
    expect(service.fetchWordAudio).toHaveBeenCalledWith({ chinese: "ba1" });
    expect(resolveHanzi).not.toHaveBeenCalled();
  });

  it("browser-TTS fallback speaks the RESOLVED glyph (never raw pinyin)", async () => {
    const service = serviceThrowing(new WordAudioError("network", "network"));
    const candidates = await buildWordItem("ba1", {
      service,
      cache: freshCache(),
      resolveHanzi: () => "八",
    });
    expect(candidates).toEqual([{ kind: "tts", text: "八", lang: "zh-CN" }]);
  });

  it("does not cache a silent skip — a later play can retry once the map exists", async () => {
    const cache = freshCache();
    const first = await buildWordItem("ba1", { cache, resolveHanzi: () => null });
    expect(first).toEqual([]);
    expect(cache.has("word#ba1")).toBe(false);
    const second = await buildWordItem("ba1", {
      cache,
      service: serviceReturning({ audioUrl: "https://cdn/八.mp3", text: "八" }),
      resolveHanzi: () => "八",
    });
    expect(second).toEqual([{ kind: "url", url: "https://cdn/八.mp3", source: "ondemand" }]);
  });
});
