/**
 * @file shared/services/audio/AudioService.ts
 * @description API service for audio generation (TTS)
 *
 * Story 14.6: Migrated to apiClient with full TypeScript type safety
 * Uses Axios with automatic token refresh and retry logic
 *
 * Extracted from features/vocabulary/services/audioService.ts (deprecated vocabulary feature).
 * Moved to shared/services/audio/ for cross-feature reuse.
 *
 * Phase 3: Uses shared AudioEngine for playback instead of inline HTMLAudioElement.
 */

import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import type {
  TurnAudioRequest,
  TurnAudioResponse,
  WordAudio,
  WordAudioRequest,
} from "@mandarin/shared-types";
import { apiClient } from "services";
import { AudioEngine } from "../../lib/audioEngine";
import type { IAudioBackend, IAudioService } from "./interfaces";

/**
 * AudioService with DI support for testing
 * Delegates to the injected backend for actual HTTP calls.
 */
export class AudioService implements IAudioService {
  constructor(private backend: IAudioBackend = new AudioBackend()) {}

  private engine = new AudioEngine();

  async fetchTurnAudio(params: TurnAudioRequest): Promise<TurnAudioResponse> {
    return this.backend.fetchTurnAudio(params);
  }

  async fetchWordAudio(params: WordAudioRequest): Promise<WordAudio> {
    return this.backend.fetchWordAudio(params);
  }

  /**
   * Play an audio URL and resolve when playback ends.
   * Components can `await` this to know when playback finished.
   * Uses shared AudioEngine for reliable lifecycle management.
   */
  async playAudio(audioUrl: string): Promise<void> {
    await this.engine.playUrl(audioUrl, 1);
  }
}

/**
 * Backend implementation using Axios with typed responses
 */
export class AudioBackend implements IAudioBackend {
  async fetchWordAudio(params: WordAudioRequest): Promise<WordAudio> {
    try {
      const { chinese } = params;
      // Backend returns { audioUrl, cached } directly (not wrapped in ApiResponse)
      const response = await apiClient.post<WordAudio>(ROUTE_PATTERNS.ttsAudio, {
        text: chinese,
      });
      return response.data;
    } catch {
      throw new Error("Failed to generate audio. Please try again.");
    }
  }

  async fetchTurnAudio(_params: TurnAudioRequest): Promise<TurnAudioResponse> {
    throw new Error("Conversation audio is no longer supported. Use fetchWordAudio instead.");
  }
}
