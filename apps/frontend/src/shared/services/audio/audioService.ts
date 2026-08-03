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
 * Phase D2: `playAudio` + the internal AudioEngine (subsystem D) and the dead
 * `fetchTurnAudio`/`playTurnAudio` conversation path were removed. Playback now
 * lives in the shared AudioManager (shared/audio/); this service only fetches
 * word audio and preserves typed failure info for the fallback policy.
 */

import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import type { WordAudio, WordAudioRequest } from "@mandarin/shared-types";
import { apiClient } from "services";
import { classifyWordAudioError } from "./errors";
import type { IAudioBackend, IAudioService } from "./interfaces";

/**
 * AudioService with DI support for testing
 * Delegates to the injected backend for actual HTTP calls.
 */
export class AudioService implements IAudioService {
  constructor(private backend: IAudioBackend = new AudioBackend()) {}

  async fetchWordAudio(params: WordAudioRequest): Promise<WordAudio> {
    return this.backend.fetchWordAudio(params);
  }
}

/**
 * Backend implementation using Axios with typed responses
 */
export class AudioBackend implements IAudioBackend {
  async fetchWordAudio(params: WordAudioRequest): Promise<WordAudio> {
    const { chinese } = params;
    try {
      // Backend returns { audioUrl, cached } directly (not wrapped in ApiResponse)
      const response = await apiClient.post<WordAudio>(ROUTE_PATTERNS.ttsAudio, {
        text: chinese,
      });
      return response.data;
    } catch (err) {
      // Preserve typed failure info (auth / rate-limit / network / server) so the
      // resolver can apply the fallback policy (see WordAudioError in ./errors).
      throw classifyWordAudioError(err);
    }
  }
}
