/**
 * @file audioService.ts
 * @description API service for audio generation (TTS)
 *
 * Story 14.6: Migrated to apiClient with full TypeScript type safety
 * Uses Axios with automatic token refresh and retry logic
 * Simplified: Removed duplicate backend classes, relies on Axios interceptors for resilience
 */

import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import type {
  TurnAudioApiResponse,
  TurnAudioRequest,
  TurnAudioResponse,
  WordAudioApiResponse,
  WordAudioRequest,
} from "@mandarin/shared-types";
import { apiClient } from "services";
import type { ConversationAudio, ConversationAudioRequest, WordAudio } from "../types";
import type { IAudioBackend, IAudioService } from "./interfaces";

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

  // For legacy/test compatibility
  async fetchConversationAudio(params: ConversationAudioRequest): Promise<ConversationAudio> {
    if (typeof this.backend.fetchConversationAudio === "function") {
      return this.backend.fetchConversationAudio(params);
    }
    throw new Error("fetchConversationAudio is not implemented. Use fetchTurnAudio instead.");
  }
}

// Backend implementation using Axios with typed responses
export class AudioBackend implements IAudioBackend {
  async fetchWordAudio(params: WordAudioRequest): Promise<WordAudio> {
    try {
      const { chinese } = params;
      const response = await apiClient.post<WordAudioApiResponse>(ROUTE_PATTERNS.ttsAudio, {
        text: chinese,
      });
      return response.data.data;
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
      const response = await apiClient.post<TurnAudioApiResponse>(ROUTE_PATTERNS.conversations, {
        type: "audio",
        ...params,
      });
      return response.data.data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("[AudioBackend] fetchTurnAudio error", {
        error: message,
        endpoint: ROUTE_PATTERNS.conversations,
      });
      throw new Error("Failed to generate conversation audio. Please try again.");
    }
  }

  async fetchConversationAudio(_params: ConversationAudioRequest): Promise<ConversationAudio> {
    throw new Error("fetchConversationAudio is not implemented. Use fetchTurnAudio instead.");
  }
}
