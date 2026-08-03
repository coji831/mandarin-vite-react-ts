/**
 * @file pages/__tests__/ReadersPage.audio.test.tsx
 * @description Phase D1 → 2 — Readers audio integration tests against the REAL
 * shared AudioManager + readers passage audio behavior + MSW passage-audio handlers.
 *
 * Covers (Testing Trophy INTEGRATION tier):
 *   - Sequence auto-advance → `completed` → `markCompleted` called.
 *   - Per-sentence 🔊 → `play(index, "single")` — no auto-advance.
 *   - Guest: `POST /v1/readers/passages/:id/audio` IS fired once (optionalAuth —
 *     no guest short-circuit); guests get real signed URLs and the sequence
 *     auto-advances exactly like users.
 *   - URL-play media error → evict + one browser-TTS fallback → continue.
 *   - Blocked autoplay (NotAllowedError) → "tap to play" affordance.
 *   - Unmount stops audio (route change kills playback).
 *
 * The readers progress service is mocked to no-ops so only passages/detail/audio
 * hit MSW (no session/bookmark/complete request noise).
 */
import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { server } from "src/mocks/server";
import { renderWithProviders } from "src/test-utils";
import { getAudioManager } from "shared/audio";
import { useAudioStore } from "shared/store";
import { useReadingStore } from "features/readers";
import { ReadersPage } from "../learn/readers/ReadersPage";
import {
  installFakeAudio,
  installFakeSpeechSynthesis,
  makeVoice,
  type FakeAudioElement,
  type FakeSpeechSynthesis,
} from "shared/audio/__tests__/helpers";

// ── MSW endpoints ───────────────────────────────────────────────────────────
const API_BASE = "http://localhost:3001/api/v1";
const PASSAGES_URL = `${API_BASE}/readers/passages`;
const PASSAGE_URL = `${API_BASE}/readers/passages/p-1`;
const PASSAGE_AUDIO_URL = `${API_BASE}/readers/passages/p-1/audio`;

const PASSAGE_ID = "p-1";
const SENTENCES = [
  { index: 0, text: "你好。", pinyin: "nǐ hǎo." },
  { index: 1, text: "再见。", pinyin: "zài jiàn." },
];

const AUDIO_MAP = {
  0: { url: "https://storage.googleapis.com/example/tts/hash/0.mp3", source: "gcs" as const },
  1: { url: "https://storage.googleapis.com/example/tts/hash/1.mp3", source: "ondemand" as const },
};

const passagesHandler = () =>
  http.get(PASSAGES_URL, () =>
    HttpResponse.json({
      data: [
        { id: PASSAGE_ID, title: "我的学校", hskLevel: 1, knownWordRatio: 80, isBookmarked: false },
      ],
    }),
  );

const passageDetailHandler = () =>
  http.get(PASSAGE_URL, () =>
    HttpResponse.json({
      data: {
        id: PASSAGE_ID,
        title: "我的学校",
        hskLevel: 1,
        sentences: SENTENCES.map((s) => ({
          index: s.index,
          text: s.text,
          pinyin: s.pinyin,
          words: [
            {
              glyph: s.text[0],
              wordId: `w_${s.index}`,
              hskLevel: 1,
              pinyin: s.pinyin,
              isKnown: true,
            },
            { glyph: "。", wordId: null, hskLevel: null, pinyin: null, isKnown: true },
          ],
        })),
      },
    }),
  );

// ── Mock the reading-progress service (no session/bookmark/complete requests) ─
vi.mock("features/readers/services/readingProgressService", () => ({
  readingProgressService: {
    getSession: vi.fn(async () => ({ currentSentence: 0, isCompleted: false })),
    updatePosition: vi.fn(async () => undefined),
    completePassage: vi.fn(async () => undefined),
    listBookmarks: vi.fn(async () => ({ bookmarks: [] })),
    addBookmark: vi.fn(async () => undefined),
    removeBookmarkByPassage: vi.fn(async () => undefined),
    checkBookmarkByPassage: vi.fn(async () => ({ isBookmarked: false })),
  },
}));

const zhVoice = makeVoice("zh-CN", "Chinese");

let fakeAudio: ReturnType<typeof installFakeAudio> | null = null;
let fakeSynth: FakeSpeechSynthesis | null = null;

function setReadingStore(isAuthenticated: boolean) {
  useReadingStore.setState({
    currentPassageId: PASSAGE_ID,
    mode: "reading",
    popover: { glyph: null, position: null },
    currentSentence: 0,
    completedPassages: new Set<string>(),
    bookmarkedPassages: new Set<string>(),
    isAuthenticated,
  });
}

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

beforeEach(() => {
  vi.clearAllMocks();
  fakeAudio = installFakeAudio();
  fakeSynth = installFakeSpeechSynthesis([zhVoice]);
});

afterEach(() => {
  server.resetHandlers();
  getAudioManager().dispose();
  useAudioStore.setState(useAudioStore.getInitialState());
  useReadingStore.setState({
    currentPassageId: null,
    mode: "library",
    popover: { glyph: null, position: null },
    currentSentence: 0,
    completedPassages: new Set<string>(),
    bookmarkedPassages: new Set<string>(),
    isAuthenticated: false,
  });
  fakeAudio?.restore();
  fakeAudio = null;
  fakeSynth = null;
  localStorage.removeItem("accessToken");
});

afterAll(() => server.close());

// ── Helpers ─────────────────────────────────────────────────────────────────

async function renderReadingPage(isAuthenticated: boolean) {
  setReadingStore(isAuthenticated);
  server.use(passagesHandler(), passageDetailHandler());
  renderWithProviders(<ReadersPage mode="reading" />, {
    auth: isAuthenticated ? { isAuthenticated: true } : { isAuthenticated: false, user: null },
  });
  // Wait for the passage to render (title visible → AudioControlBar enabled).
  await screen.findByText("我的学校");
}

describe("ReadersPage audio (shared AudioManager)", () => {
  it("user: sequence play auto-advances through the passage → completed → markCompleted", async () => {
    const audioPosted = vi.fn();
    server.use(
      http.post(PASSAGE_AUDIO_URL, () => {
        audioPosted();
        return HttpResponse.json({ data: { audioUrls: AUDIO_MAP } });
      }),
    );
    await renderReadingPage(true);

    await userEvent.click(screen.getByRole("button", { name: "Play audio" }));

    // Sentence 0 URL plays.
    const el0 = await waitFor(() => {
      const el: FakeAudioElement | undefined = fakeAudio?.last();
      expect(el).toBeDefined();
      return el!;
    });
    expect(el0.src).toBe(AUDIO_MAP[0].url);
    expect(audioPosted).toHaveBeenCalledTimes(1); // one POST for the whole passage

    // End sentence 0 → auto-advance to sentence 1.
    act(() => el0.emitEnded());
    const el1 = await waitFor(() => {
      expect(fakeAudio!.elements.length).toBe(2);
      return fakeAudio!.last()!;
    });
    expect(el1.src).toBe(AUDIO_MAP[1].url);

    // End sentence 1 → sequence completes.
    act(() => el1.emitEnded());
    await waitFor(() => expect(useAudioStore.getState().hasCompleted).toBe(true));
    expect(useAudioStore.getState().status).toBe("stopped");
    // markCompleted (idempotent, Set-based) is called by the completed-event path.
    expect(useReadingStore.getState().completedPassages.has(PASSAGE_ID)).toBe(true);
  });

  it("user: per-sentence 🔊 plays ONE sentence (single mode — no auto-advance)", async () => {
    server.use(
      http.post(PASSAGE_AUDIO_URL, () => HttpResponse.json({ data: { audioUrls: AUDIO_MAP } })),
    );
    await renderReadingPage(true);

    // Sentence 1 (index 1) per-sentence button.
    await userEvent.click(screen.getByRole("button", { name: "Play sentence 2" }));

    const el = await waitFor(() => fakeAudio!.last()!);
    expect(el.src).toBe(AUDIO_MAP[1].url);

    // Single mode: ending does NOT auto-advance — playback finishes.
    act(() => el.emitEnded());
    await waitFor(() => expect(useAudioStore.getState().status).toBe("stopped"));
    expect(useAudioStore.getState().hasCompleted).toBe(false);
    expect(fakeAudio!.elements.length).toBe(1);
  });

  it("guest: POST /audio fired once; real signed-URL items play and the sequence auto-advances (identical to users)", async () => {
    const audioPosted = vi.fn();
    server.use(
      http.post(PASSAGE_AUDIO_URL, () => {
        // optionalAuth — guests hit the endpoint exactly like users.
        audioPosted();
        return HttpResponse.json({ data: { audioUrls: AUDIO_MAP } });
      }),
    );
    await renderReadingPage(false);

    await userEvent.click(screen.getByRole("button", { name: "Play audio" }));

    // Sentence 0 URL plays (guest gets a real signed URL, not TTS short-circuit).
    const el0 = await waitFor(() => {
      const el: FakeAudioElement | undefined = fakeAudio?.last();
      expect(el).toBeDefined();
      return el!;
    });
    expect(el0.src).toBe(AUDIO_MAP[0].url);
    expect(audioPosted).toHaveBeenCalledTimes(1); // one POST for the whole passage

    // End sentence 0 → auto-advance to sentence 1.
    act(() => el0.emitEnded());
    const el1 = await waitFor(() => {
      expect(fakeAudio!.elements.length).toBe(2);
      return fakeAudio!.last()!;
    });
    expect(el1.src).toBe(AUDIO_MAP[1].url);

    // End sentence 1 → sequence completes.
    act(() => el1.emitEnded());
    await waitFor(() => expect(useAudioStore.getState().hasCompleted).toBe(true));
    expect(useAudioStore.getState().status).toBe("stopped");
  });

  it("user: URL-play media error → evict + one browser-TTS fallback → sequence continues", async () => {
    server.use(
      http.post(PASSAGE_AUDIO_URL, () => HttpResponse.json({ data: { audioUrls: AUDIO_MAP } })),
    );
    await renderReadingPage(true);

    await userEvent.click(screen.getByRole("button", { name: "Play audio" }));

    const el0 = await waitFor(() => fakeAudio!.last()!);
    expect(el0.src).toBe(AUDIO_MAP[0].url);

    // Media-level failure on sentence 0 → evict + TTS fallback once.
    act(() => el0.emitError());
    await waitFor(() => expect(fakeSynth!.speak).toHaveBeenCalledTimes(1));
    expect(fakeSynth!.lastUtterance()?.text).toBe(SENTENCES[0].text);

    // Let the TTS fallback complete → the sequence advances to sentence 1.
    act(() => fakeSynth!.emitEnd());
    const el1 = await waitFor(() => {
      expect(fakeAudio!.elements.length).toBe(2);
      return fakeAudio!.last()!;
    });
    expect(el1.src).toBe(AUDIO_MAP[1].url);

    act(() => el1.emitEnded());
    await waitFor(() => expect(useAudioStore.getState().hasCompleted).toBe(true));
  });

  it("user: blocked autoplay (NotAllowedError) → 'tap to play' affordance", async () => {
    fakeAudio?.restore();
    fakeAudio = installFakeAudio({
      playImpl: () =>
        Promise.reject(Object.assign(new Error("blocked"), { name: "NotAllowedError" })),
    });
    server.use(
      http.post(PASSAGE_AUDIO_URL, () => HttpResponse.json({ data: { audioUrls: AUDIO_MAP } })),
    );
    await renderReadingPage(true);

    await userEvent.click(screen.getByRole("button", { name: "Play audio" }));

    // Converges on status:"blocked" → the control bar exposes a tap-to-play affordance.
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Tap to play audio" })).toBeInTheDocument(),
    );
    expect(useAudioStore.getState().status).toBe("blocked");
  });

  it("unmount (route change) stops audio", async () => {
    server.use(
      http.post(PASSAGE_AUDIO_URL, () => HttpResponse.json({ data: { audioUrls: AUDIO_MAP } })),
    );
    const { unmount } = await renderReadingPageAsReturned(true);

    await userEvent.click(screen.getByRole("button", { name: "Play audio" }));
    await waitFor(() => expect(fakeAudio!.last()).toBeDefined());

    unmount();
    // The hook's unmount cleanup calls manager.stop() → playback halts, cursor cleared.
    expect(getAudioManager().getSnapshot().status).toBe("stopped");
    expect(getAudioManager().getSnapshot().currentIndex).toBeNull();
  });
});

/** Like renderReadingPage but returns the render result (for unmount). */
async function renderReadingPageAsReturned(isAuthenticated: boolean) {
  setReadingStore(isAuthenticated);
  server.use(passagesHandler(), passageDetailHandler());
  const result = renderWithProviders(<ReadersPage mode="reading" />, {
    auth: isAuthenticated ? { isAuthenticated: true } : { isAuthenticated: false, user: null },
  });
  await screen.findByText("我的学校");
  return result;
}
