import { ApiClient } from "../../../services/apiClient";

// Fallback backend for local development
export class LocalAudioBackend implements IAudioBackend {
  async fetchWordAudio(params: WordAudioRequest): Promise<WordAudio> {
    const { chinese } = params;
    const endpoint = API_ENDPOINTS.TTS;
    const body = { text: chinese };
    const response = await ApiClient.publicRequest(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`Audio generation failed (local): ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  }

  async fetchTurnAudio(params: {
    wordId: string;
    turnIndex: number;
    text: string;
    voice?: string;
  }): Promise<{ audioUrl: string }> {
    const endpoint = API_ENDPOINTS.CONVERSATION;
    const response = await ApiClient.publicRequest(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "audio", ...params }),
    });
    if (!response.ok) {
      throw new Error(`Audio generation failed (local): ${response.statusText}`);
    }
    return await response.json();
  }

  // For legacy/test compatibility
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

// Default backend implementation using fetch
export class DefaultAudioBackend implements IAudioBackend {
  async fetchWordAudio(params: WordAudioRequest): Promise<WordAudio> {
    const { chinese } = params;
    const endpoint = API_ENDPOINTS.TTS;
    const body = { text: chinese };
    const response = await ApiClient.publicRequest(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`Audio generation failed: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  }

  async fetchTurnAudio(params: {
    wordId: string;
    turnIndex: number;
    text: string;
    voice?: string;
  }): Promise<{ audioUrl: string }> {
    const endpoint = API_ENDPOINTS.CONVERSATION;
    const response = await ApiClient.publicRequest(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "audio", ...params }),
    });
    if (!response.ok) {
      throw new Error(`Audio generation failed: ${response.statusText}`);
    }
    return await response.json();
  }

  // For legacy/test compatibility
  async fetchConversationAudio(_params: ConversationAudioRequest): Promise<ConversationAudio> {
    throw new Error("fetchConversationAudio is not implemented. Use fetchTurnAudio instead.");
  }
}
