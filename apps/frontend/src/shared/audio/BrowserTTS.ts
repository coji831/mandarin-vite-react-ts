/**
 * @file shared/audio/BrowserTTS.ts
 * @description Plain class wrapping the SpeechSynthesis API — not a React hook.
 *
 * MOVED from shared/lib/browserTTS.ts as part of the Audio Playback
 * consolidation (Phase A), with HARDENING:
 *   - Android-WebView absence: `speechSynthesis` absent from `window` OR
 *     present-but-broken (missing speak/cancel, or any call throws/no-ops) →
 *     `speak()` resolves immediately / reports unavailable. Never hangs, never
 *     loops, never throws.
 *   - `getVoices()` is async until `voiceschanged` (Safari 16+): we speak
 *     immediately with `utterance.lang` using the default voice, subscribe to
 *     `voiceschanged` once, and re-apply the zh voice when the list arrives.
 *   - `cancel()` any in-flight utterance before speaking (cancel-on-new — no
 *     overlapping speech).
 *   - Keep utterances short (Chrome ~15s long-utterance pause guard) — matches
 *     current usage (single words / short sentences).
 */

type SynthLike = Pick<SpeechSynthesis, "speak" | "cancel" | "getVoices"> &
  Partial<Pick<SpeechSynthesis, "addEventListener" | "removeEventListener">>;

export class BrowserTTS {
  private zhVoice: SpeechSynthesisVoice | null = null;
  private voicesSubscribed = false;
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private pendingResolve: (() => void) | null = null;

  /**
   * Whether speech synthesis is usable. Treats both "absent from window" and
   * "present but non-functional (Android WebView)" as unavailable.
   */
  isAvailable(): boolean {
    return this.getSynth() !== null;
  }

  /**
   * Speak `text`. Resolves on `onend`; also resolves on cancel/error so the
   * caller never hangs. Resolves immediately when unavailable.
   */
  speak(text: string, rate: number, lang: string): Promise<void> {
    const synth = this.getSynth();
    if (!text || !synth) {
      return Promise.resolve();
    }

    let utterance: SpeechSynthesisUtterance;
    try {
      // cancel-on-new — never queue overlapping speech.
      try {
        synth.cancel();
      } catch {
        /* no-op */
      }
      utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = rate;
      const voice = this.pickVoice(synth);
      if (voice) utterance.voice = voice;
    } catch {
      // Present-but-broken (WebView) → treat as unavailable, never hang.
      return Promise.resolve();
    }

    this.activeUtterance = utterance;
    this.ensureVoiceSubscription(synth);

    return new Promise<void>((resolve) => {
      this.pendingResolve = resolve;
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        if (this.activeUtterance === utterance) this.activeUtterance = null;
        if (this.pendingResolve === resolve) this.pendingResolve = null;
        utterance.onend = null;
        utterance.onerror = null;
        resolve();
      };
      utterance.onend = finish;
      utterance.onerror = finish;
      try {
        synth.speak(utterance);
      } catch {
        finish();
      }
    });
  }

  /** Cancel any in-flight utterance and ensure its promise settles. */
  cancel(): void {
    const synth = this.getSynth();
    if (synth) {
      try {
        synth.cancel();
      } catch {
        /* no-op */
      }
    }
    if (this.activeUtterance) {
      this.activeUtterance.onend = null;
      this.activeUtterance.onerror = null;
      this.activeUtterance = null;
    }
    const resolve = this.pendingResolve;
    this.pendingResolve = null;
    resolve?.();
  }

  private getSynth(): SynthLike | null {
    if (typeof window === "undefined") return null;
    const synth = window.speechSynthesis as SynthLike | undefined;
    if (!synth) return null;
    // Android WebView: property may exist but lack the API surface.
    if (typeof synth.speak !== "function" || typeof synth.cancel !== "function") {
      return null;
    }
    return synth;
  }

  private pickVoice(synth: SynthLike): SpeechSynthesisVoice | null {
    if (this.zhVoice) return this.zhVoice;
    try {
      const voices = synth.getVoices() ?? [];
      this.zhVoice = voices.find((v) => v.lang.startsWith("zh")) ?? null;
      return this.zhVoice;
    } catch {
      return null;
    }
  }

  private ensureVoiceSubscription(synth: SynthLike): void {
    if (this.voicesSubscribed) return;
    this.voicesSubscribed = true;
    const handler = () => {
      const voice = this.pickVoice(synth);
      // Re-apply the zh voice to an in-flight utterance once the list arrives.
      if (voice && this.activeUtterance) {
        this.activeUtterance.voice = voice;
      }
    };
    try {
      synth.addEventListener?.("voiceschanged", handler);
    } catch {
      /* no-op */
    }
  }
}
