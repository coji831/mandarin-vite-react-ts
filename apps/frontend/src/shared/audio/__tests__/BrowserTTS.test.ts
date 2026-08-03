/**
 * @file shared/audio/__tests__/BrowserTTS.test.ts
 * @description Unit tests for BrowserTTS with a mocked speechSynthesis.
 *
 * Covers the hardening: Android-WebView absence → immediate resolve (never
 * hangs/loops), empty voices → speak with default voice then re-apply zh on
 * `voiceschanged`, cancel-on-new, and promise settlement on end/cancel/error.
 */

import { afterEach, describe, expect, it } from "vitest";
import { BrowserTTS } from "../BrowserTTS";
import { installFakeSpeechSynthesis, makeVoice } from "./helpers";

const zhVoice = makeVoice("zh-CN", "Chinese");
const enVoice = makeVoice("en-US", "English");

describe("BrowserTTS", () => {
  afterEach(() => {
    // jsdom has no speechSynthesis by default; ensure a clean slate.
    if (Object.getOwnPropertyDescriptor(window, "speechSynthesis")) {
      delete (window as { speechSynthesis?: unknown }).speechSynthesis;
    }
    delete (window as { SpeechSynthesisUtterance?: unknown }).SpeechSynthesisUtterance;
  });

  it("reports unavailable and resolves immediately when speechSynthesis is absent", async () => {
    const tts = new BrowserTTS();
    expect(tts.isAvailable()).toBe(false);
    await expect(tts.speak("你好", 1, "zh-CN")).resolves.toBeUndefined();
  });

  it("treats present-but-non-functional speechSynthesis as unavailable (Android WebView)", async () => {
    // Property exists but lacks the speak/cancel API surface → unavailable.
    Object.defineProperty(window, "speechSynthesis", {
      writable: true,
      configurable: true,
      value: { getVoices: () => [] },
    });
    const tts = new BrowserTTS();
    expect(tts.isAvailable()).toBe(false);
    await expect(tts.speak("你好", 1, "zh-CN")).resolves.toBeUndefined();
  });

  it("speaks with the default voice when voices are empty, then re-applies zh on voiceschanged", async () => {
    const synth = installFakeSpeechSynthesis([]);
    const tts = new BrowserTTS();
    const p1 = tts.speak("你好", 1, "zh-CN");
    const u1 = synth.lastUtterance();
    expect(u1).not.toBeNull();
    expect(u1!.lang).toBe("zh-CN");
    expect(u1!.rate).toBe(1);
    expect(u1!.voice).toBeNull(); // default voice (list not ready yet)

    // Voices arrive while u1 is still speaking → re-apply the zh voice.
    synth.voices.push(zhVoice);
    synth.emitVoicesChanged();
    expect(u1!.voice).toBe(zhVoice);

    synth.emitEnd();
    await p1;
  });

  it("uses the zh voice on subsequent speaks once the list is cached", async () => {
    const synth = installFakeSpeechSynthesis([zhVoice, enVoice]);
    const tts = new BrowserTTS();
    const p1 = tts.speak("你好", 1, "zh-CN");
    expect(synth.lastUtterance()!.voice).toBe(zhVoice);
    synth.emitEnd();
    await p1;
  });

  it("cancel-on-new: a second speak cancels the first (no overlapping speech)", async () => {
    const synth = installFakeSpeechSynthesis([zhVoice]);
    const tts = new BrowserTTS();
    const p1 = tts.speak("first", 1, "zh-CN");
    expect(synth.cancel).toHaveBeenCalledTimes(1); // cancel-on-new before speaking

    const p2 = tts.speak("second", 1, "zh-CN");
    expect(synth.lastUtterance()!.text).toBe("second");
    // The first utterance's promise must settle (its onerror fired via cancel).
    await expect(p1).resolves.toBeUndefined();

    synth.emitEnd();
    await p2;
  });

  it("resolves a pending speak when cancel() is called externally (never hangs)", async () => {
    const _synth = installFakeSpeechSynthesis([zhVoice]);
    const tts = new BrowserTTS();
    const p = tts.speak("你好", 1, "zh-CN");
    expect(tts.isAvailable()).toBe(true);
    tts.cancel();
    await expect(p).resolves.toBeUndefined();
  });

  it("resolves when the utterance errors (e.g. interrupted)", async () => {
    const synth = installFakeSpeechSynthesis([zhVoice]);
    const tts = new BrowserTTS();
    const p = tts.speak("你好", 1, "zh-CN");
    synth.emitError();
    await expect(p).resolves.toBeUndefined();
  });

  it("resolves immediately when no text is provided", async () => {
    installFakeSpeechSynthesis([zhVoice]);
    const tts = new BrowserTTS();
    await expect(tts.speak("", 1, "zh-CN")).resolves.toBeUndefined();
  });
});
