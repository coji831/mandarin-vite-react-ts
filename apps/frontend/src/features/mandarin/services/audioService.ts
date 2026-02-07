/**
 * @file audioService.ts
 * @description API service for audio generation (TTS)
 *
 * Story 14.6: Migrated to apiClient with full TypeScript type safety
 * Uses Axios with automatic token refresh and retry logic
 */

import { apiClient } from "../../../services/axiosClient";
import type {
  WordAudioApiResponse,
  WordAudioRequest,
  TurnAudioApiResponse,
  TurnAudioRequest,
  TurnAudioResponse,
} from "@mandarin/shared-types";

// Fallback backend for local development
export class LocalAudioBackend implements IAudioBackend {
  async fetchWordAudio(params: WordAudioRequest): Promise<WordAudio> {
    try {
      const { chinese } = params;
      const response = await apiClient.post<WordAudioApiResponse>(API_ENDPOINTS.TTS, {
        text: chinese,
      });
      return response.data.data;
    } catch (error: any) {
      console.error("LocalAudioBackend.fetchWordAudio error", {
        error: error.message,
        endpoint: API_ENDPOINTS.TTS,
      });
      throw new Error("Failed to generate audio. Please try again.");
    }
  }

  async fetchTurnAudio(params: TurnAudioRequest): Promise<TurnAudioResponse> {
    try {
      const response = await apiClient.post<TurnAudioApiResponse>(API_ENDPOINTS.CONVERSATION, {
        type: "audio",
        ...params,
      });
      return response.data.data;
    } catch (error: any) {
      console.error("LocalAudioBackend.fetchTurnAudio error", {
        error: error.message,
        endpoint: API_ENDPOINTS.CONVERSATION,
      });
      throw new Error("Failed to generate conversation audio. Please try again.");
    }
  }

  async fetchConversationAudio(_params: ConversationAudioRequest): Promise<ConversationAudio> {
    throw new Error("fetchConversationAudio is not implemented. Use fetchTurnAudio instead.");
  }
}
// src/features/mandarin/services/audioService.ts
// AudioService implementation with fallback support (Epic 11, Story 11.3)

import { API_ENDPOINTS } from "@mandarin/shared-constants";
import type {
  ConversationAudio,
  ConversationAudioRequest,
  WordAudio,
  WordAudioRequest,
} from "../types";
import type { IAudioBackend, IAudioService } from "./interfaces";

// AudioService with backend swap and fallback support
export class AudioService implements IAudioService {
  protected backend: IAudioBackend;
  declare fallbackService?: AudioService;

  constructor(backend?: IAudioBackend, withFallback = true) {
    this.backend = backend || new DefaultAudioBackend();
    if (withFallback) {
      this.fallbackService = new AudioService(new LocalAudioBackend(), false);
    }
  }

  async fetchTurnAudio(params: {
    wordId: string;
    turnIndex: number;
    text: string;
    voice?: string;
  }): Promise<{ audioUrl: string }> {
    try {
      return await this.backend.fetchTurnAudio(params);
    } catch (err) {
      if (!this.fallbackService) throw err;
      return this.fallbackService.fetchTurnAudio(params);
    }
  }

  async fetchWordAudio(params: WordAudioRequest): Promise<WordAudio> {
    try {
      return await this.backend.fetchWordAudio(params);
    } catch (err) {
      if (!this.fallbackService) throw err;
      return this.fallbackService.fetchWordAudio(params);
    }
  }

  // For legacy/test compatibility
  async fetchConversationAudio(params: ConversationAudioRequest): Promise<ConversationAudio> {
    if (typeof this.backend.fetchConversationAudio === "function") {
      return this.backend.fetchConversationAudio(params);
    }
    throw new Error("fetchConversationAudio is not implemented. Use fetchTurnAudio instead.");
  }
}

// Default backend implementation using Axios
export class DefaultAudioBackend implements IAudioBackend {
  async fetchWordAudio(params: WordAudioRequest): Promise<WordAudio> {
    try {
      const { chinese } = params;
      const response = await apiClient.post<WordAudioApiResponse>(API_ENDPOINTS.TTS, {
        text: chinese,
      });
      return response.data.data;
    } catch (error: any) {
      console.error("DefaultAudioBackend.fetchWordAudio error", {
        error: error.message,
        endpoint: API_ENDPOINTS.TTS,
      });
      throw new Error("Failed to generate audio. Please try again.");
    }
  }

  async fetchTurnAudio(params: TurnAudioRequest): Promise<TurnAudioResponse> {
    try {
      const response = await apiClient.post<TurnAudioApiResponse>(API_ENDPOINTS.CONVERSATION, {
        type: "audio",
        ...params,
      });
      return response.data.data;
    } catch (error: any) {
      console.error("DefaultAudioBackend.fetchTurnAudio error", {
        error: error.message,
        endpoint: API_ENDPOINTS.CONVERSATION,
      });
      throw new Error("Failed to generate conversation audio. Please try again.");
    }
  }

  async fetchConversationAudio(_params: ConversationAudioRequest): Promise<ConversationAudio> {
    throw new Error("fetchConversationAudio is not implemented. Use fetchTurnAudio instead.");
  }
}
