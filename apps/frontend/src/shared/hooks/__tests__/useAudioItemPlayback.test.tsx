/**
 * @file shared/hooks/__tests__/useAudioItemPlayback.test.tsx
 * @description Integration test (Testing Trophy INTEGRATION tier) for the
 * per-item audio hook against the REAL singleton manager + default word contract
 * + service + MSW `/v1/tts` (and stubbed `window.Audio` / `speechSynthesis`).
 *
 * Phase 2 (candidates-as-data): the default word contract (`defaultWordBehavior`)
 * builds candidates from `fetchWordAudio` — happy path (URL playback), 5xx →
 * browser-TTS candidate, auth-agnostic word TTS (guests and users both POST
 * /v1/tts — no guest short-circuit for words), 401 → empty candidates (silent
 * skip, no TTS loop), and blocked autoplay → `status:"blocked"` (tap to play).
 */

import { act, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { server } from "src/mocks/server";
import { createAudioManager, getAudioManager } from "../../audio";
import { wordAudioCache } from "../../audio/contracts";
import { useAudioStore } from "../../store";
import { __resetPinyinCharacterMapCache } from "shared/services";
import { useAudioItemPlayback } from "../useAudioItemPlayback";
import {
  installFakeAudio,
  installFakeSpeechSynthesis,
  makeVoice,
  type FakeAudioElement,
  type FakeSpeechSynthesis,
} from "../../audio/__tests__/helpers";

const TTS_URL = "http://localhost:3001/api/v1/tts";
const REFRESH_URL = "http://localhost:3001/api/v1/auth/refresh";
const CHAR_MAP_URL = "http://localhost:3001/api/v1/foundations/data/pinyin-character-map";

const zhVoice = makeVoice("zh-CN", "Chinese");

let fakeAudio: ReturnType<typeof installFakeAudio> | null = null;
let fakeSynth: FakeSpeechSynthesis | null = null;

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  getAudioManager().dispose();
  useAudioStore.setState(useAudioStore.getInitialState());
  wordAudioCache.clear();
  __resetPinyinCharacterMapCache();
  fakeAudio?.restore();
  fakeAudio = null;
  fakeSynth = null;
  localStorage.removeItem("accessToken");
});
afterAll(() => server.close());

describe("useAudioItemPlayback (integration + MSW)", () => {
  it("happy path: POST /v1/tts → URL playback (single mode)", async () => {
    fakeAudio = installFakeAudio();
    fakeSynth = installFakeSpeechSynthesis([zhVoice]);
    server.use(
      http.post(TTS_URL, () =>
        HttpResponse.json({ audioUrl: "https://cdn/好.mp3", text: "好", languageCode: "zh-CN" }),
      ),
    );

    const { result } = renderHook(() => useAudioItemPlayback());

    act(() => result.current.play("好"));

    const el = await waitFor(() => {
      const element: FakeAudioElement | undefined = fakeAudio?.last();
      expect(element).toBeDefined();
      return element!;
    });
    expect(el.src).toBe("https://cdn/好.mp3");
    // Element exists → playback initiated → status is "playing".
    expect(result.current.isPlaying).toBe(true);

    // No TTS used on the URL path.
    expect(fakeSynth.speak).not.toHaveBeenCalled();

    // End playback → single mode, no auto-advance → stopped.
    act(() => el.emitEnded());
    await waitFor(() => expect(result.current.status).toBe("stopped"));
    expect(result.current.isPlaying).toBe(false);
  });

  it("5xx error → browser-TTS fallback", async () => {
    fakeAudio = installFakeAudio();
    fakeSynth = installFakeSpeechSynthesis([zhVoice]);
    server.use(http.post(TTS_URL, () => HttpResponse.json({ error: "boom" }, { status: 500 })));

    const { result } = renderHook(() => useAudioItemPlayback());

    act(() => result.current.play("好"));

    await waitFor(() => expect(fakeSynth!.speak).toHaveBeenCalled());
    const utterance = fakeSynth!.lastUtterance();
    expect(utterance!.text).toBe("好");
    expect(utterance!.lang).toBe("zh-CN");

    act(() => fakeSynth!.emitEnd());
    await waitFor(() => expect(result.current.status).toBe("stopped"));
  });

  it("word audio POSTs /v1/tts for everyone (auth-agnostic — no guest short-circuit)", async () => {
    fakeAudio = installFakeAudio();
    fakeSynth = installFakeSpeechSynthesis([zhVoice]);
    let posted = false;
    server.use(
      http.post(TTS_URL, () => {
        posted = true;
        return HttpResponse.json({ audioUrl: "https://cdn/好.mp3", text: "好" });
      }),
    );

    // Phase 0 (TTS detachment): the hook no longer reads useAuth() — guests and
    // users share one auth-agnostic path (no guest short-circuit for words).
    const { result } = renderHook(() => useAudioItemPlayback());

    act(() => result.current.play("好"));
    await waitFor(() => expect(posted).toBe(true));

    const el = fakeAudio.last();
    act(() => el.emitEnded());
    await waitFor(() => expect(result.current.status).toBe("stopped"));
  });

  it("401 → silent skip (no TTS fallback, no spinner loop)", async () => {
    fakeAudio = installFakeAudio();
    fakeSynth = installFakeSpeechSynthesis([zhVoice]);
    server.use(
      // The axios interceptor tries to refresh on 401; it must fail gracefully.
      http.post(REFRESH_URL, () => HttpResponse.json({ error: "MISSING_TOKEN" }, { status: 400 })),
      http.post(TTS_URL, () => HttpResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 })),
    );

    const { result } = renderHook(() => useAudioItemPlayback());

    act(() => result.current.play("好"));

    // Empty candidates (auth) → silent skip → single-mode finish → stopped.
    await waitFor(() => expect(result.current.status).toBe("stopped"));
    expect(fakeSynth.speak).not.toHaveBeenCalled();
  });

  it("blocked autoplay (policy disallowed) → 'tap to play' (no engine, no TTS)", async () => {
    fakeAudio = installFakeAudio();
    fakeSynth = installFakeSpeechSynthesis([zhVoice]);
    server.use(
      http.post(TTS_URL, () => HttpResponse.json({ audioUrl: "https://cdn/好.mp3", text: "好" })),
    );

    // A manager with a disallowed policy (the hook keeps it on init).
    const manager = createAudioManager({ autoplayPolicy: () => "disallowed" });
    const { result } = renderHook(() => useAudioItemPlayback({ manager }));

    act(() => result.current.play("好"));

    // Converges on status:"blocked" → the surface shows a tap-to-play affordance.
    await waitFor(() => expect(result.current.status).toBe("blocked"));
    expect(fakeSynth.speak).not.toHaveBeenCalled(); // no TTS loop while blocked
    expect(fakeAudio.elements.length).toBe(0); // no engine element created

    manager.dispose();
  });

  it('play("ba1") resolves pinyin→Hanzi via the shared charMap and POSTs the glyph 八', async () => {
    fakeAudio = installFakeAudio();
    fakeSynth = installFakeSpeechSynthesis([zhVoice]);
    __resetPinyinCharacterMapCache();
    let postedChinese: string | null = null;
    server.use(
      http.get(CHAR_MAP_URL, () => HttpResponse.json({ ba: "八" })),
      http.post(TTS_URL, async ({ request }) => {
        postedChinese = ((await request.json()) as { text: string }).text;
        return HttpResponse.json({ audioUrl: "https://cdn/八.mp3", text: "八" });
      }),
    );

    const { result } = renderHook(() => useAudioItemPlayback());
    act(() => result.current.play("ba1"));

    const el = await waitFor(() => {
      const element: FakeAudioElement | undefined = fakeAudio?.last();
      expect(element).toBeDefined();
      return element!;
    });
    expect(postedChinese).toBe("八"); // resolved glyph, never raw pinyin
    expect(el.src).toBe("https://cdn/八.mp3");
    expect(result.current.isPlaying).toBe(true);
    expect(fakeSynth.speak).not.toHaveBeenCalled();

    act(() => el.emitEnded());
    await waitFor(() => expect(result.current.status).toBe("stopped"));
  });

  it('play("ba1") silently skips when the charMap has no mapping (no POST, no TTS)', async () => {
    fakeAudio = installFakeAudio();
    fakeSynth = installFakeSpeechSynthesis([zhVoice]);
    __resetPinyinCharacterMapCache();
    let posted = false;
    server.use(
      http.get(CHAR_MAP_URL, () => HttpResponse.json({})),
      http.post(TTS_URL, () => {
        posted = true;
        return HttpResponse.json({ audioUrl: "https://cdn/八.mp3", text: "八" });
      }),
    );

    const { result } = renderHook(() => useAudioItemPlayback());
    act(() => result.current.play("ba1"));

    await waitFor(() => expect(result.current.status).toBe("stopped"));
    expect(posted).toBe(false);
    expect(fakeSynth.speak).not.toHaveBeenCalled();
  });

  it('play("你好") — Hanzi fast path: no charMap fetch, TTS POSTs 你好 unchanged', async () => {
    fakeAudio = installFakeAudio();
    fakeSynth = installFakeSpeechSynthesis([zhVoice]);
    __resetPinyinCharacterMapCache();
    let postedChinese: string | null = null;
    let charMapFetched = false;
    server.use(
      http.get(CHAR_MAP_URL, () => {
        charMapFetched = true;
        return HttpResponse.json({ ba: "八" });
      }),
      http.post(TTS_URL, async ({ request }) => {
        postedChinese = ((await request.json()) as { text: string }).text;
        return HttpResponse.json({ audioUrl: "https://cdn/你好.mp3", text: "你好" });
      }),
    );

    const { result } = renderHook(() => useAudioItemPlayback());
    act(() => result.current.play("你好"));

    const el = await waitFor(() => {
      const element: FakeAudioElement | undefined = fakeAudio?.last();
      expect(element).toBeDefined();
      return element!;
    });
    expect(postedChinese).toBe("你好");
    expect(charMapFetched).toBe(false); // Hanzi short-circuits — no map fetch
    expect(el.src).toBe("https://cdn/你好.mp3");

    act(() => el.emitEnded());
    await waitFor(() => expect(result.current.status).toBe("stopped"));
  });
});
