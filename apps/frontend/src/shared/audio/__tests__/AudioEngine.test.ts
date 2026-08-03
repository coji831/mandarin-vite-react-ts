/**
 * @file shared/audio/__tests__/AudioEngine.test.ts
 * @description Unit tests for AudioEngine with a fake HTMLAudioElement.
 *
 * Includes the regression test for the hang bug: stop / signal-abort resolve
 * the `playUrl` promise with "aborted" (the old implementation left it pending
 * forever). Also covers rate, paused/ended/error reasons, NotAllowedError, and
 * muted-autoplay.
 */

import { afterEach, describe, expect, it } from "vitest";
import { AudioEngine } from "../AudioEngine";
import { installFakeAudio } from "./helpers";

describe("AudioEngine", () => {
  let fakeAudio: ReturnType<typeof installFakeAudio>;

  afterEach(() => {
    fakeAudio?.restore();
  });

  it("resolves 'ended' when playback finishes", async () => {
    fakeAudio = installFakeAudio();
    const engine = new AudioEngine();
    const ac = new AbortController();
    const promise = engine.playUrl("https://a.mp3", 1, ac.signal);
    const el = fakeAudio.last();
    expect(el.src).toBe("https://a.mp3");
    expect(el.playbackRate).toBe(1);
    el.emitEnded();
    await expect(promise).resolves.toBe("ended");
  });

  it("sets preservesPitch so speech at a rate ≠ 1 keeps natural pitch", async () => {
    fakeAudio = installFakeAudio();
    const engine = new AudioEngine();
    const ac = new AbortController();
    const promise = engine.playUrl("https://a.mp3", 1.25, ac.signal);
    const el = fakeAudio.last();
    expect(el.preservesPitch).toBe(true);
    el.emitEnded();
    await promise;
  });

  it("regression: resolves 'aborted' on stop() — never hangs", async () => {
    fakeAudio = installFakeAudio();
    const engine = new AudioEngine();
    const ac = new AbortController();
    const promise = engine.playUrl("https://a.mp3", 1, ac.signal);
    engine.stop();
    await expect(promise).resolves.toBe("aborted");
    // The element must be paused + rewound + dropped.
    const el = fakeAudio.last();
    expect(el.pause).toHaveBeenCalled();
    expect(el.currentTime).toBe(0);
  });

  it("regression: resolves 'aborted' when the abort signal fires", async () => {
    fakeAudio = installFakeAudio();
    const engine = new AudioEngine();
    const ac = new AbortController();
    const promise = engine.playUrl("https://a.mp3", 1, ac.signal);
    ac.abort();
    await expect(promise).resolves.toBe("aborted");
  });

  it("resolves 'aborted' immediately when the signal is already aborted", async () => {
    fakeAudio = installFakeAudio();
    const engine = new AudioEngine();
    const ac = new AbortController();
    ac.abort();
    await expect(engine.playUrl("https://a.mp3", 1, ac.signal)).resolves.toBe("aborted");
  });

  it("resolves 'paused' on pause(), retaining the element (position kept)", async () => {
    fakeAudio = installFakeAudio();
    const engine = new AudioEngine();
    const ac = new AbortController();
    const promise = engine.playUrl("https://a.mp3", 1, ac.signal);
    const el = fakeAudio.last();
    el.currentTime = 5;
    engine.pause();
    await expect(promise).resolves.toBe("paused");
    // Element retained (not nulled) — position 5 preserved.
    expect(el.pause).toHaveBeenCalled();
    expect(el.currentTime).toBe(5);
  });

  it("resolves 'error' on media error (e.g. 404 / codec)", async () => {
    fakeAudio = installFakeAudio();
    const engine = new AudioEngine();
    const ac = new AbortController();
    const promise = engine.playUrl("https://a.mp3", 1, ac.signal);
    fakeAudio.last().emitError();
    await expect(promise).resolves.toBe("error");
  });

  it("rejects with the NotAllowedError when play() is blocked (autoplay fallback)", async () => {
    const notAllowed = new DOMException("autoplay", "NotAllowedError");
    fakeAudio = installFakeAudio({ playImpl: () => Promise.reject(notAllowed) });
    const engine = new AudioEngine();
    const ac = new AbortController();
    const promise = engine.playUrl("https://a.mp3", 1, ac.signal);
    await expect(promise).rejects.toBe(notAllowed);
  });

  it("setRate updates the live element's playbackRate", async () => {
    fakeAudio = installFakeAudio();
    const engine = new AudioEngine();
    const ac = new AbortController();
    const promise = engine.playUrl("https://a.mp3", 1.5, ac.signal);
    const el = fakeAudio.last();
    expect(el.playbackRate).toBe(1.5);
    engine.setRate(2);
    expect(el.playbackRate).toBe(2);
    el.emitEnded();
    await promise;
  });

  it("muted-autoplay: applies muted to the new element and unmute() clears it", async () => {
    fakeAudio = installFakeAudio();
    const engine = new AudioEngine();
    engine.setMuted(true);
    const ac = new AbortController();
    const promise = engine.playUrl("https://a.mp3", 1, ac.signal);
    const el = fakeAudio.last();
    expect(el.muted).toBe(true);
    engine.unmute();
    expect(el.muted).toBe(false);
    el.emitEnded();
    await promise;
  });

  it("a new playUrl aborts the previous playback with 'aborted'", async () => {
    fakeAudio = installFakeAudio();
    const engine = new AudioEngine();
    const ac1 = new AbortController();
    const first = engine.playUrl("https://a.mp3", 1, ac1.signal);
    const ac2 = new AbortController();
    const second = engine.playUrl("https://b.mp3", 1, ac2.signal);
    await expect(first).resolves.toBe("aborted");
    fakeAudio.last().emitEnded();
    await expect(second).resolves.toBe("ended");
  });
});
