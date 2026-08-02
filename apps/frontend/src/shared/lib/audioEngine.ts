/**
 * @file shared/lib/audioEngine.ts
 * @description Plain class wrapping HTMLAudioElement lifecycle — not a React hook.
 * Phase 2: Extracted from readers useAudioEngine for stability and testability.
 * Phase 3: Moved from features/readers/lib/ to shared/lib/ for cross-feature reuse.
 */

export class AudioEngine {
  private audioRef: HTMLAudioElement | null = null;
  private abortRef = false;

  async playUrl(url: string, rate: number): Promise<void> {
    this.abortRef = false;
    if (this.audioRef) {
      this.audioRef.pause();
      this.audioRef = null;
    }

    const audio = new window.Audio();
    audio.src = url;
    audio.playbackRate = rate;
    audio.load();
    this.audioRef = audio;

    return new Promise<void>((resolve, reject) => {
      audio.onended = () => {
        if (this.abortRef) return;
        resolve();
      };
      audio.onerror = () => {
        if (this.abortRef) return;
        reject(new Error("Audio playback failed"));
      };
      audio.play().catch((err: unknown) => {
        if (this.abortRef) return;
        reject(err);
      });
    });
  }

  pause(): void {
    this.abortRef = true;
    if (this.audioRef) {
      this.audioRef.pause();
    }
  }

  stop(): void {
    this.abortRef = true;
    if (this.audioRef) {
      this.audioRef.pause();
      this.audioRef.currentTime = 0;
      this.audioRef = null;
    }
  }

  setRate(rate: number): void {
    if (this.audioRef) {
      this.audioRef.playbackRate = rate;
    }
  }
}
