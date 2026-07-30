/**
 * @file shared/lib/browserTTS.ts
 * @description Plain class wrapping SpeechSynthesis API — not a React hook.
 * Phase 2: Extracted from readers useBrowserTTS for stability and testability.
 * Phase 3: Moved from features/readers/lib/ to shared/lib/ for cross-feature reuse.
 */

export class BrowserTTS {
  speak(text: string, rate: number, lang: string): Promise<void> {
    if (!text || typeof window === "undefined" || !("speechSynthesis" in window)) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = rate;
      const voices = window.speechSynthesis.getVoices();
      const zhVoice = voices.find((v) => v.lang.startsWith("zh"));
      if (zhVoice) utterance.voice = zhVoice;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    });
  }

  cancel(): void {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }
}
