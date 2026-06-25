/**
 * @file audioService.ts
 * @description API service for audio generation (TTS)
 *
 * Story 14.6: Migrated to apiClient with full TypeScript type safety
 * Uses Axios with automatic token refresh and retry logic
 * Simplified: Removed duplicate backend classes, relies on Axios interceptors for resilience
 */

import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import type { TurnAudioRequest, TurnAudioResponse, WordAudioRequest } from "@mandarin/shared-types";
import { apiClient } from "services";
import type { WordAudio } from "../types";
import type { IAudioBackend, IAudioService } from "./interfaces";

// Small silent WAV fallback (very short, valid WAV)
const SILENT_WAV =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=";

// AudioService with DI support for testing
export class AudioService implements IAudioService {
  constructor(private backend: IAudioBackend = new AudioBackend()) {}

  async fetchTurnAudio(params: {
    wordId: string;
    turnIndex: number;
    text: string;
    voice?: string;
  }): Promise<{ audioUrl: string }> {
    return this.backend.fetchTurnAudio(params);
  }

  async fetchWordAudio(params: WordAudioRequest): Promise<WordAudio> {
    return this.backend.fetchWordAudio(params);
  }

  /**
   * Fetch example audio using cacheKey.
   * Returns backend response (expects `{ audio_url: string }`).
   */
  async fetchExampleAudio(cacheKey: string): Promise<{ audio_url: string }> {
    // Delegate to backend implementation
    // Backend returns `{ audio_url: string }` (snake_case)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof (this.backend as any).fetchExampleAudio === "function") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (this.backend as any).fetchExampleAudio(cacheKey);
    }
    // Fallback: return a tiny silent audio to avoid hard errors in UI
    return { audio_url: SILENT_WAV };
  }

  /**
   * Play an audio URL and resolve when playback ends.
   * Components can `await` this to know when playback finished.
   */
  async playAudio(audioUrl: string): Promise<void> {
    if (typeof window === "undefined") return Promise.resolve();
    return new Promise<void>((resolve, reject) => {
      const audio = new window.Audio();
      audio.src = audioUrl;
      audio.load();
      // Resolve on ended, reject on error
      audio.onended = () => resolve();
      audio.onerror = (e) => reject(e);
      // Start playback (may reject due to autoplay policies)
      audio.play().catch((err) => {
        console.error("[AudioService] playAudio failed", err);
        reject(err);
      });
    });
  }
}

// Backend implementation using Axios with typed responses
export class AudioBackend implements IAudioBackend {
  async fetchWordAudio(params: WordAudioRequest): Promise<WordAudio> {
    try {
      const { chinese } = params;
      // Backend returns { audioUrl, cached } directly (not wrapped in ApiResponse)
      const response = await apiClient.post<WordAudio>(ROUTE_PATTERNS.ttsAudio, {
        text: chinese,
      });
      return response.data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("[AudioBackend] fetchWordAudio error", {
        error: message,
        endpoint: ROUTE_PATTERNS.ttsAudio,
      });
      throw new Error("Failed to generate audio. Please try again.");
    }
  }

  async fetchTurnAudio(params: TurnAudioRequest): Promise<TurnAudioResponse> {
    try {
      // Backend returns audio metadata directly (not wrapped in ApiResponse)
      const response = await apiClient.post<TurnAudioResponse>(ROUTE_PATTERNS.conversations, {
        type: "audio",
        ...params,
      });
      return response.data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("[AudioBackend] fetchTurnAudio error", {
        error: message,
        endpoint: ROUTE_PATTERNS.conversations,
      });
      throw new Error("Failed to generate conversation audio. Please try again.");
    }
  }

  async fetchExampleAudio(cacheKey: string): Promise<{ audio_url: string }> {
    try {
      const response = await apiClient.get<{ audio_url: string }>(
        ROUTE_PATTERNS.examples + ROUTE_PATTERNS.examplesAudio,
        { params: { cacheKey } },
      );
      // Expect backend to return { audio_url }
      return response.data ?? { audio_url: SILENT_WAV };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("[AudioBackend] fetchExampleAudio error", {
        error: message,
        endpoint: ROUTE_PATTERNS.examples + ROUTE_PATTERNS.examplesAudio,
      });
      return { audio_url: SILENT_WAV };
    }
  }
}
