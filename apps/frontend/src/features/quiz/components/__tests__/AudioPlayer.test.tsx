/**
 * @file features/quiz/components/__tests__/AudioPlayer.test.tsx
 * @description Integration tests (Testing Trophy INTEGRATION tier) for the quiz
 * AudioPlayer (Phase D2 — migrated to `useAudioItemPlayback`).
 *
 * The component drives the REAL shared manager + default word contract + service
 * + MSW `/v1/tts` (with stubbed `window.Audio` / `speechSynthesis`), covering:
 *  - happy path: POST /v1/tts → URL playback → button shows "Playing..."
 *  - 5xx → browser-TTS fallback (button label settles back)
 *  - guest AND user both POST /v1/tts (optionalAuth — no guest short-circuit)
 *  - blocked autoplay (getAutoplayPolicy "disallowed") → "Tap to play" affordance,
 *    no TTS loop, no spinner
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { http, HttpResponse } from "msw";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { server } from "src/mocks/server";
import { AuthContext } from "features/auth";
import type { AuthContextValue, User } from "features/auth";
import { getAudioManager, wordAudioCache } from "shared/audio";
import { __resetPinyinCharacterMapCache } from "shared/services";
import { useAudioStore } from "shared/store";
import { AudioPlayer } from "../AudioPlayer";
import {
  installFakeAudio,
  installFakeSpeechSynthesis,
  makeVoice,
  type FakeSpeechSynthesis,
} from "shared/audio/__tests__/helpers";

const TTS_URL = "http://localhost:3001/api/v1/tts";
const CHAR_MAP_URL = "http://localhost:3001/api/v1/foundations/data/pinyin-character-map";

const zhVoice = makeVoice("zh-CN", "Chinese");

const mockUser: User = {
  id: "user-1",
  email: "user@example.com",
  displayName: "Test User",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

function makeAuthValue(isAuthenticated: boolean): AuthContextValue {
  return {
    user: isAuthenticated ? mockUser : null,
    isLoading: false,
    isAuthenticated,
    login: async () => undefined,
    register: async () => undefined,
    logout: async () => undefined,
    refreshTokens: async () => "mock-token",
  };
}

function wrapper(auth: AuthContextValue) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
  };
}

let fakeAudio: ReturnType<typeof installFakeAudio> | null = null;
let fakeSynth: FakeSpeechSynthesis | null = null;
let originalAutoplayPolicy: unknown;

function mockAutoplayPolicy(policy: "allowed" | "allowed-muted" | "disallowed") {
  const nav = navigator as unknown as { getAutoplayPolicy?: unknown };
  originalAutoplayPolicy = nav.getAutoplayPolicy;
  nav.getAutoplayPolicy = () => policy;
}

function restoreAutoplayPolicy() {
  const nav = navigator as unknown as { getAutoplayPolicy?: unknown };
  if (originalAutoplayPolicy === undefined) {
    delete nav.getAutoplayPolicy;
  } else {
    nav.getAutoplayPolicy = originalAutoplayPolicy;
  }
  originalAutoplayPolicy = undefined;
}

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
beforeEach(() => {
  // AudioPlayer mounts usePinyinCharacterMap (fetch-on-mount) — stub the
  // shared charMap endpoint so the mount fetch resolves and isn't an unhandled
  // MSW request. Each test may override it with `server.use(...)`.
  __resetPinyinCharacterMapCache();
  server.use(http.get(CHAR_MAP_URL, () => HttpResponse.json({ hǎo: "好" })));
});
afterEach(() => {
  server.resetHandlers();
  getAudioManager().dispose();
  useAudioStore.setState(useAudioStore.getInitialState());
  wordAudioCache.clear();
  __resetPinyinCharacterMapCache();
  fakeAudio?.restore();
  fakeAudio = null;
  fakeSynth = null;
  restoreAutoplayPolicy();
  localStorage.removeItem("accessToken");
});
afterAll(() => server.close());

function installFakes() {
  fakeAudio = installFakeAudio();
  fakeSynth = installFakeSpeechSynthesis([zhVoice]);
}

describe("AudioPlayer (word audio via useAudioItemPlayback)", () => {
  it("happy path: POST /v1/tts → URL playback → 'Playing...'", async () => {
    installFakes();
    server.use(
      http.post(TTS_URL, () =>
        HttpResponse.json({ audioUrl: "https://cdn/好.mp3", text: "好", languageCode: "zh-CN" }),
      ),
    );

    render(<AudioPlayer audioKey="hǎo" character="好" />, {
      wrapper: wrapper(makeAuthValue(true)),
    });

    fireEvent.click(screen.getByRole("button", { name: /Play Audio/i }));

    const el = await waitFor(() => {
      const element = fakeAudio?.last();
      expect(element).toBeDefined();
      return element!;
    });
    expect(el.src).toBe("https://cdn/好.mp3");
    expect(await screen.findByText("Playing...")).toBeInTheDocument();

    // URL path — no browser-TTS fallback.
    expect(fakeSynth!.speak).not.toHaveBeenCalled();
  });

  it("5xx error → browser-TTS fallback (no spinner stuck)", async () => {
    installFakes();
    server.use(http.post(TTS_URL, () => HttpResponse.json({ error: "boom" }, { status: 500 })));

    render(<AudioPlayer audioKey="hǎo" character="好" />, {
      wrapper: wrapper(makeAuthValue(true)),
    });

    fireEvent.click(screen.getByRole("button", { name: /Play Audio/i }));

    await waitFor(() => expect(fakeSynth!.speak).toHaveBeenCalled());
    const utterance = fakeSynth!.lastUtterance();
    expect(utterance!.text).toBe("好");
    expect(utterance!.lang).toBe("zh-CN");

    // Once TTS ends, playback settles back to the label (no perpetual spinner).
    fakeSynth!.emitEnd();
    await waitFor(() => expect(screen.getByText("Play Audio")).toBeInTheDocument());
  });

  it("guests also POST /v1/tts (optionalAuth) — no guest short-circuit for words", async () => {
    installFakes();
    let posted = false;
    server.use(
      http.post(TTS_URL, () => {
        posted = true;
        return HttpResponse.json({ audioUrl: "https://cdn/好.mp3", text: "好" });
      }),
    );

    render(<AudioPlayer audioKey="hǎo" character="好" />, {
      wrapper: wrapper(makeAuthValue(false)), // guest
    });

    fireEvent.click(screen.getByRole("button", { name: /Play Audio/i }));

    await waitFor(() => expect(posted).toBe(true));
    await waitFor(() => expect(fakeAudio!.last()).toBeDefined());
  });

  it("users also POST /v1/tts (same behavior as guests for words)", async () => {
    installFakes();
    let posted = false;
    server.use(
      http.post(TTS_URL, () => {
        posted = true;
        return HttpResponse.json({ audioUrl: "https://cdn/好.mp3", text: "好" });
      }),
    );

    render(<AudioPlayer audioKey="hǎo" character="好" />, {
      wrapper: wrapper(makeAuthValue(true)), // user
    });

    fireEvent.click(screen.getByRole("button", { name: /Play Audio/i }));

    await waitFor(() => expect(posted).toBe(true));
    await waitFor(() => expect(fakeAudio!.last()).toBeDefined());
  });

  it("blocked autoplay → 'Tap to play' affordance, no TTS, no spinner", async () => {
    installFakes();
    mockAutoplayPolicy("disallowed");
    server.use(
      http.post(TTS_URL, () => HttpResponse.json({ audioUrl: "https://cdn/好.mp3", text: "好" })),
    );

    render(<AudioPlayer audioKey="hǎo" character="好" />, {
      wrapper: wrapper(makeAuthValue(true)),
    });

    fireEvent.click(screen.getByRole("button", { name: /Play Audio/i }));

    // Blocked → affordance shown; never falls back to TTS or spins.
    expect(await screen.findByText("Tap to play")).toBeInTheDocument();
    expect(fakeSynth!.speak).not.toHaveBeenCalled();
    expect(fakeAudio!.elements.length).toBe(0);
  });

  it("resolves a pinyin-only audioKey via the shared charMap and POSTs the glyph", async () => {
    installFakes();
    __resetPinyinCharacterMapCache();
    server.use(
      http.get(CHAR_MAP_URL, () => HttpResponse.json({ ba: "八" })),
      http.post(TTS_URL, () => HttpResponse.json({ audioUrl: "https://cdn/八.mp3", text: "八" })),
    );

    render(<AudioPlayer audioKey="ba1" />, {
      wrapper: wrapper(makeAuthValue(true)),
    });

    // Pinyin resolution depends on the shared charMap, which the hook fetches on
    // mount — wait for it to settle before clicking (in-memory MSW is fast).
    await new Promise((r) => setTimeout(r, 50));

    fireEvent.click(screen.getByRole("button", { name: /Play Audio/i }));

    const el = await waitFor(() => {
      const element = fakeAudio?.last();
      expect(element).toBeDefined();
      return element!;
    });
    expect(el.src).toBe("https://cdn/八.mp3");
    expect(fakeSynth!.speak).not.toHaveBeenCalled();
  });

  it("silently skips a pinyin-only audioKey with no mapped character (no POST, no TTS)", async () => {
    installFakes();
    __resetPinyinCharacterMapCache();
    let posted = false;
    server.use(
      http.get(CHAR_MAP_URL, () => HttpResponse.json({})),
      http.post(TTS_URL, () => {
        posted = true;
        return HttpResponse.json({ audioUrl: "https://cdn/八.mp3", text: "八" });
      }),
    );

    render(<AudioPlayer audioKey="ba1" />, {
      wrapper: wrapper(makeAuthValue(true)),
    });

    fireEvent.click(screen.getByRole("button", { name: /Play Audio/i }));

    // Resolve + silent-skip path never POSTs / never browser-TTSs.
    await new Promise((r) => setTimeout(r, 100));
    expect(posted).toBe(false);
    expect(fakeSynth!.speak).not.toHaveBeenCalled();
    expect(fakeAudio!.elements.length).toBe(0);
  });
});
