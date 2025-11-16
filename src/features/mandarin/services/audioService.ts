// Fallback backend for local development
export class LocalAudioBackend implements IAudioBackend {
  async fetchWordAudio(params: WordAudioRequest): Promise<WordAudio> {
    const { chinese } = params;
    const endpoint = "http://localhost:3001" + API_ROUTES.ttsAudio;
    const body = { text: chinese };
    const response = await fetch(endpoint, {
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

  async fetchConversationAudio(params: ConversationAudioRequest): Promise<ConversationAudio> {
    const endpoint = "http://localhost:3001" + API_ROUTES.conversationAudioGenerate;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!response.ok) {
      throw new Error(`Audio generation failed (local): ${response.statusText}`);
    }
    const audio = await response.json();
    return audio;
  }
}
// src/features/mandarin/services/audioService.ts
// AudioService implementation with fallback support (Epic 11, Story 11.3)

import { API_ROUTES } from "../../../../shared/constants/apiPaths";
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

  // Fetch audio for a conversation by word Id
  async fetchConversationAudio(params: ConversationAudioRequest): Promise<ConversationAudio> {
    try {
      return await this.backend.fetchConversationAudio(params);
    } catch (err) {
      if (!this.fallbackService) throw err;
      return this.fallbackService.fetchConversationAudio(params);
    }
  }

  // Fetch audio for a single word by Chinese text
  async fetchWordAudio(params: WordAudioRequest): Promise<WordAudio> {
    try {
      return await this.backend.fetchWordAudio(params);
    } catch (err) {
      if (!this.fallbackService) throw err;
      return this.fallbackService.fetchWordAudio(params);
    }
  }
}

// Default backend implementation using fetch
export class DefaultAudioBackend implements IAudioBackend {
  async fetchWordAudio(params: WordAudioRequest): Promise<WordAudio> {
    const { chinese } = params;
    const endpoint = API_ROUTES.ttsAudio;
    const body = { text: chinese };
    const response = await fetch(endpoint, {
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

  async fetchConversationAudio(params: ConversationAudioRequest): Promise<ConversationAudio> {
    const endpoint = API_ROUTES.conversationAudioGenerate;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!response.ok) {
      throw new Error(`Audio generation failed: ${response.statusText}`);
    }
    const audio = await response.json();
    return audio;
  }
}
