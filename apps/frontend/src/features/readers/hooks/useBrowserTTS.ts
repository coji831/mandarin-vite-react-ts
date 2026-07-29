/**
 * @file hooks/useBrowserTTS.ts
 * @description SpeechSynthesis wrapper for browser TTS fallback.
 * Story 21.6: Extracted from useSentenceAudio for SRP compliance.
 *
 * Single responsibility: wrap the Web Speech API (SpeechSynthesisUtterance).
 * No knowledge of sentences, sequences, or HTMLAudioElement.
 */
import { useCallback } from "react";

export interface UseBrowserTTSReturn {
  /** Speaks text using browser SpeechSynthesis. Resolves on end or error. */
  speak: (text: string, rate: number, lang: string) => Promise<void>;
  /** Cancels any ongoing SpeechSynthesis utterance. */
  cancel: () => void;
}

export function useBrowserTTS(): UseBrowserTTSReturn {
  const speak = useCallback(async (text: string, rate: number, lang: string): Promise<void> => {
    if (!text || typeof window === "undefined" || !("speechSynthesis" in window)) return;

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
  }, []);

  const cancel = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  return { speak, cancel };
}
