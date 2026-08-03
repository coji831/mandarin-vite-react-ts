/**
 * @file features/readers/audio/__tests__/PassageAudioBehavior.test.ts
 * @description Unit tests for buildPassageAudioBehavior (Phase D1 → 2).
 *
 * Replaces the retired PassageAudioResolver test. Pins the contract:
 *   - ONE shared fetch path for guests AND users: `sources` is a lazy producer
 *     that fetches the passage audio map ONCE (in-flight deduped); the injected
 *     service is invoked exactly once per passage (`POST
 *     /v1/readers/passages/:id/audio` is `optionalAuth` — no guest
 *     short-circuit).
 *   - gcs/ondemand entries with a URL → candidates `[url, tts]`; failed/missing/
 *     empty URL → `[]` (silent skip).
 *   - Fetch failure → every sentence gets `[]` (silent skip, never a spinner).
 *   - `onUrlFailed` → `"fallback"` (URL media error → next candidate = TTS).
 */

import { describe, expect, it, vi, type Mock } from "vitest";
import { resolveBehaviorSources } from "shared/audio";
import type { AudioBehavior, PlayableItem, PlayableSource } from "shared/audio";
import { buildPassageAudioBehavior } from "../PassageAudioBehavior";
import type { SentenceAudioMap } from "../../types";

const sentences = [
  { index: 0, text: "你好。" },
  { index: 1, text: "再见。" },
];

type FetchAudioMock = Mock<(passageId: string) => Promise<{ audioUrls: SentenceAudioMap }>>;

function serviceReturning(map: SentenceAudioMap): FetchAudioMock {
  return vi.fn(async () => ({ audioUrls: map }));
}

function serviceThrowing(err: unknown): FetchAudioMock {
  return vi.fn(async () => Promise.reject(err));
}

function behaviorWith(service: FetchAudioMock, passageId = "p-1"): AudioBehavior {
  return buildPassageAudioBehavior({ passageId, sentences, fetchAudio: service });
}

async function resolveItems(behavior: AudioBehavior): Promise<PlayableItem[]> {
  return resolveBehaviorSources(behavior.sources);
}

const ttsCandidates = (text: string): PlayableSource[] => [{ kind: "tts", text, lang: "zh-CN" }];

describe("PassageAudioBehavior", () => {
  it("is a sequence strategy behavior", () => {
    const behavior = behaviorWith(serviceReturning({}));
    expect(behavior.strategy).toBe("sequence");
  });

  it("guest path: POSTs the passage-audio endpoint once and builds url→tts candidates (identical to users)", async () => {
    const service = serviceReturning({
      0: { url: "https://cdn.example/0.mp3", source: "gcs" },
    });
    const behavior = behaviorWith(service);

    // Lazy async producer — not an eager plain array.
    expect(Array.isArray(behavior.sources)).toBe(false);

    const items = await resolveItems(behavior);
    expect(items).toHaveLength(2);
    expect(items[0]).toEqual({
      id: "0",
      candidates: [
        { kind: "url", url: "https://cdn.example/0.mp3", source: "gcs" },
        ...ttsCandidates("你好。"),
      ],
      title: "你好。",
    });
    // Sentence 1 has no map entry → empty candidates (silent skip).
    expect(items[1]).toEqual({ id: "1", candidates: [], title: "再见。" });

    // The critical assertion: guests POST once — same as the user path.
    expect(service).toHaveBeenCalledTimes(1);
    expect(service).toHaveBeenCalledWith("p-1");
  });

  it("maps gcs/ondemand URL entries to url→tts candidates (one fetch)", async () => {
    const service = serviceReturning({
      0: { url: "https://storage.googleapis.com/x/0.mp3", source: "gcs" },
      1: { url: "https://storage.googleapis.com/x/1.mp3", source: "ondemand" },
    });
    const behavior = behaviorWith(service);

    const items = await resolveItems(behavior);
    expect(items[0].candidates).toEqual([
      { kind: "url", url: "https://storage.googleapis.com/x/0.mp3", source: "gcs" },
      { kind: "tts", text: "你好。", lang: "zh-CN" },
    ]);
    expect(items[1].candidates).toEqual([
      { kind: "url", url: "https://storage.googleapis.com/x/1.mp3", source: "ondemand" },
      { kind: "tts", text: "再见。", lang: "zh-CN" },
    ]);
    expect(service).toHaveBeenCalledWith("p-1");
    expect(service).toHaveBeenCalledTimes(1);
  });

  it("one fetch per passage (in-flight dedupe across resolves)", async () => {
    const service = serviceReturning({
      0: { url: "https://cdn/0.mp3", source: "gcs" },
      1: { url: "https://cdn/1.mp3", source: "ondemand" },
    });
    const behavior = behaviorWith(service);

    const [first, second] = await Promise.all([resolveItems(behavior), resolveItems(behavior)]);
    expect(first).toHaveLength(2);
    expect(second).toHaveLength(2);
    expect(service).toHaveBeenCalledTimes(1); // one POST for the whole passage
  });

  it("failed / missing / empty-URL entries → empty candidates (silent skip)", async () => {
    const service = serviceReturning({
      // sentence index 1 has a failed entry; index 0 is missing
      1: { url: "", source: "failed" },
    });
    const behavior = behaviorWith(service);

    const items = await resolveItems(behavior);
    expect(items[0].candidates).toEqual([]); // missing → silent skip
    expect(items[1].candidates).toEqual([]); // failed/empty URL → silent skip
  });

  it("fetch failure → every sentence empty candidates (never a spinner)", async () => {
    const service = serviceThrowing(new Error("boom"));
    const behavior = behaviorWith(service);

    const items = await resolveItems(behavior);
    expect(items).toHaveLength(2);
    expect(items[0].candidates).toEqual([]);
    expect(items[1].candidates).toEqual([]);
  });

  it("onUrlFailed returns 'fallback' (URL media error → next candidate = TTS)", () => {
    const behavior = behaviorWith(serviceReturning({}));
    expect(behavior.onUrlFailed?.(itemsForOnUrlFailed())).toBe("fallback");
  });
});

function itemsForOnUrlFailed(): PlayableItem {
  return { id: "0", candidates: [{ kind: "url", url: "https://x/0.mp3" }] };
}
