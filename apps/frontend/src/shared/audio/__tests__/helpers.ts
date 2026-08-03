/**
 * @file shared/audio/__tests__/helpers.ts
 * @description Shared fake factories for audio tests (not a test file).
 *
 * - `createFakeAudioElement` / `installFakeAudio` — stub `window.Audio` for the
 *   real AudioEngine (unit + integration tests).
 * - `createFakeSpeechSynthesis` / `installFakeSpeechSynthesis` — stub
 *   `window.speechSynthesis` + `SpeechSynthesisUtterance` for BrowserTTS.
 * - `createFakeEngine` / `createFakeTts` — controllable backends for
 *   AudioManager integration tests.
 */

import { vi, type Mock } from "vitest";
import type { PlaybackEndReason } from "../types";

// ── Fake HTMLAudioElement ─────────────────────────────────────────────────────

export interface FakeAudioElement {
  src: string;
  playbackRate: number;
  muted: boolean;
  preservesPitch: boolean;
  currentTime: number;
  paused: boolean;
  onended: (() => void) | null;
  onerror: (() => void) | null;
  load: ReturnType<typeof vi.fn>;
  play: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
  emitEnded: () => void;
  emitError: () => void;
}

export function createFakeAudioElement(options?: {
  playImpl?: () => Promise<void>;
}): FakeAudioElement {
  const state = {
    src: "",
    playbackRate: 1,
    muted: false,
    preservesPitch: false,
    currentTime: 0,
    paused: true,
    onended: null as (() => void) | null,
    onerror: null as (() => void) | null,
  };
  const fake: FakeAudioElement = {
    ...state,
    load: vi.fn(() => {
      state.paused = true;
    }),
    play: vi.fn(() => {
      state.paused = false;
      if (options?.playImpl) return options.playImpl();
      return Promise.resolve();
    }),
    pause: vi.fn(() => {
      state.paused = true;
    }),
    emitEnded: () => {
      fake.onended?.();
    },
    emitError: () => {
      fake.onerror?.();
    },
  };
  return fake;
}

export interface InstalledFakeAudio {
  elements: FakeAudioElement[];
  last: () => FakeAudioElement;
  restore: () => void;
}

/** Replace `window.Audio` with a factory returning fresh fake elements. */
export function installFakeAudio(options?: { playImpl?: () => Promise<void> }): InstalledFakeAudio {
  const original = (window as { Audio?: unknown }).Audio;
  const elements: FakeAudioElement[] = [];
  // `function` (not arrow) so `new window.Audio()` is constructible; returning
  // the fake element object overrides the default `this` binding.
  const factory = vi.fn(function () {
    const el = createFakeAudioElement(options);
    elements.push(el);
    return el;
  });
  (window as unknown as { Audio: unknown }).Audio = factory;
  return {
    elements,
    last: () => elements[elements.length - 1],
    restore: () => {
      if (original === undefined) {
        delete (window as unknown as { Audio?: unknown }).Audio;
      } else {
        (window as unknown as { Audio: unknown }).Audio = original;
      }
    },
  };
}

// ── Fake SpeechSynthesis ──────────────────────────────────────────────────────

export interface FakeSpeechSynthesis {
  voices: SpeechSynthesisVoice[];
  getVoices: ReturnType<typeof vi.fn>;
  speak: ReturnType<typeof vi.fn>;
  cancel: ReturnType<typeof vi.fn>;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  emitVoicesChanged: () => void;
  emitEnd: () => void;
  emitError: () => void;
  lastUtterance: () => SpeechSynthesisUtterance | null;
  restore: () => void;
}

export function makeVoice(lang: string, name: string): SpeechSynthesisVoice {
  return {
    name,
    lang,
    default: lang === "zh-CN",
    localService: true,
    voiceURI: `${lang}-${name}`,
  } as SpeechSynthesisVoice;
}

/**
 * Fake `speechSynthesis` that mirrors real browser behavior:
 *  - `speak(u)` stores the utterance as current.
 *  - `cancel()` fires `onerror` ("canceled") on the current utterance (real
 *    browsers do this), so a pending `speak()` promise settles.
 *  - `emitEnd` / `emitError` simulate normal/error completion.
 */
export function installFakeSpeechSynthesis(
  voices: SpeechSynthesisVoice[] = [],
): FakeSpeechSynthesis {
  const listeners: Record<string, (() => void)[]> = {};
  let current: SpeechSynthesisUtterance | null = null;

  const synth: FakeSpeechSynthesis = {
    voices,
    getVoices: vi.fn(() => [...voices]),
    speak: vi.fn((utterance: SpeechSynthesisUtterance) => {
      current = utterance;
    }),
    cancel: vi.fn(() => {
      if (current) {
        const u = current;
        current = null;
        const event = { error: "canceled", utterance: u } as SpeechSynthesisErrorEvent;
        u.onerror?.(event);
      }
    }),
    addEventListener: vi.fn((type: string, cb: () => void) => {
      (listeners[type] ??= []).push(cb);
    }),
    removeEventListener: vi.fn(() => undefined),
    emitVoicesChanged: () => {
      (listeners.voiceschanged ?? []).forEach((cb) => cb());
    },
    emitEnd: () => {
      if (current) {
        const u = current;
        current = null;
        const event = { utterance: u } as SpeechSynthesisEvent;
        u.onend?.(event);
      }
    },
    emitError: () => {
      if (current) {
        const u = current;
        current = null;
        const event = { error: "interrupted", utterance: u } as SpeechSynthesisErrorEvent;
        u.onerror?.(event);
      }
    },
    lastUtterance: () => current,
    restore: () => {
      if (Object.getOwnPropertyDescriptor(window, "speechSynthesis")) {
        delete (window as { speechSynthesis?: unknown }).speechSynthesis;
      }
      delete (window as { SpeechSynthesisUtterance?: unknown }).SpeechSynthesisUtterance;
    },
  };

  // `new SpeechSynthesisUtterance(text)` — jsdom does not provide it.
  const FakeUtterance = vi.fn(function (
    this: {
      text: string;
      lang: string;
      rate: number;
      voice: SpeechSynthesisVoice | null;
      onend: (() => void) | null;
      onerror: ((e: SpeechSynthesisErrorEvent) => void) | null;
    },
    text: string,
  ) {
    this.text = text;
    this.lang = "";
    this.rate = 1;
    this.voice = null;
    this.onend = null;
    this.onerror = null;
  });

  Object.defineProperty(window, "speechSynthesis", {
    writable: true,
    configurable: true,
    value: synth,
  });
  (window as unknown as { SpeechSynthesisUtterance: unknown }).SpeechSynthesisUtterance =
    FakeUtterance;

  return synth;
}

// ── Controllable AudioEngine fake (for AudioManager tests) ───────────────────

export interface FakePlaySession {
  url: string;
  rate: number;
  signal: AbortSignal;
  resolve: (reason: PlaybackEndReason) => void;
  onAbort: () => void;
  settled: boolean;
}

export interface FakeEngine {
  playUrl: Mock<(url: string, rate: number, signal: AbortSignal) => Promise<PlaybackEndReason>>;
  pause: Mock<() => void>;
  stop: Mock<() => void>;
  setRate: Mock<(rate: number) => void>;
  setMuted: Mock<(muted: boolean) => void>;
  unmute: Mock<() => void>;
  dispose: Mock<() => void>;
  sessions: FakePlaySession[];
  settleLast: (reason: PlaybackEndReason) => void;
  settleSession: (session: FakePlaySession, reason: PlaybackEndReason) => void;
  resolveLastEnded: () => void;
}

/** Engine fake mirroring the real signal-abort semantics (resolve "aborted"). */
export function createFakeEngine(): FakeEngine {
  const sessions: FakePlaySession[] = [];
  const settleSession = (session: FakePlaySession, reason: PlaybackEndReason) => {
    if (session.settled) return;
    session.settled = true;
    session.signal.removeEventListener("abort", session.onAbort);
    session.resolve(reason);
  };
  const settleLast = (reason: PlaybackEndReason) => {
    const session = [...sessions].reverse().find((s) => !s.settled);
    if (session) settleSession(session, reason);
  };

  const engine: FakeEngine = {
    playUrl: vi.fn((url: string, rate: number, signal: AbortSignal) => {
      return new Promise<PlaybackEndReason>((resolve) => {
        const session: FakePlaySession = {
          url,
          rate,
          signal,
          resolve,
          onAbort: () => settleSession(session, "aborted"),
          settled: false,
        };
        signal.addEventListener("abort", session.onAbort);
        sessions.push(session);
      });
    }),
    pause: vi.fn(() => settleLast("paused")),
    stop: vi.fn(() => settleLast("aborted")),
    setRate: vi.fn(),
    setMuted: vi.fn(),
    unmute: vi.fn(),
    dispose: vi.fn(() => {
      for (const s of [...sessions]) settleSession(s, "aborted");
    }),
    sessions,
    settleLast,
    settleSession,
    resolveLastEnded: () => settleLast("ended"),
  };
  return engine;
}

// ── Controllable BrowserTTS fake (for AudioManager tests) ────────────────────

export interface FakeSpeakSession {
  text: string;
  rate: number;
  lang: string;
  resolve: () => void;
  settled: boolean;
}

export interface FakeTts {
  isAvailable: Mock<() => boolean>;
  speak: Mock<(text: string, rate: number, lang: string) => Promise<void>>;
  cancel: Mock<() => void>;
  speaks: FakeSpeakSession[];
  resolveLast: () => void;
}

/** TTS fake: `resolveLast()` simulates utterance completion. */
export function createFakeTts(options: { available?: boolean } = {}): FakeTts {
  const speaks: FakeSpeakSession[] = [];
  const tts: FakeTts = {
    isAvailable: vi.fn(() => options.available ?? true),
    speak: vi.fn((text: string, rate: number, lang: string) => {
      return new Promise<void>((resolve) => {
        speaks.push({ text, rate, lang, resolve, settled: false });
      });
    }),
    cancel: vi.fn(() => {
      for (const s of [...speaks]) {
        if (!s.settled) {
          s.settled = true;
          s.resolve();
        }
      }
    }),
    speaks,
    resolveLast: () => {
      const session = [...speaks].reverse().find((s) => !s.settled);
      if (session) {
        session.settled = true;
        session.resolve();
      }
    },
  };
  return tts;
}
