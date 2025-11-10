// src/features/mandarin/services/audioService.ts
// AudioService implementation with fallback support (Epic 11, Story 11.3)

import { IAudioService, BaseService } from "./interfaces";
import { ConversationAudio } from "../types/Conversation";
import { API_ROUTES } from "../../../../shared/constants/apiPaths";

export class AudioService
  extends BaseService<
    [{ wordId?: string; conversationId?: string; voice?: string; bitrate?: number }],
    ConversationAudio
  >
  implements IAudioService
{
  declare fallbackService?: IAudioService &
    BaseService<
      [{ wordId?: string; conversationId?: string; voice?: string; bitrate?: number }],
      ConversationAudio
    >;

  async fetchAudioForConversation(
    conversationId: string,
    voice?: string,
    bitrate?: number
  ): Promise<ConversationAudio> {
    try {
      return await this.fetch({ conversationId, voice, bitrate });
    } catch (err) {
      if (this.fallbackService) {
        return this.fallbackService.fetchAudioForConversation(conversationId, voice, bitrate);
      }
      throw err;
    }
  }

  async fetchAudioForWord(
    wordId: string,
    voice?: string,
    bitrate?: number
  ): Promise<ConversationAudio> {
    try {
      return await this.fetch({ wordId, voice, bitrate });
    } catch (err) {
      if (this.fallbackService) {
        return this.fallbackService.fetchAudioForWord(wordId, voice, bitrate);
      }
      throw err;
    }
  }

  // Required by BaseService: fetch audio for either conversation or word
  async fetch(params: {
    wordId?: string;
    conversationId?: string;
    voice?: string;
    bitrate?: number;
  }): Promise<ConversationAudio> {
    const { wordId, conversationId, voice, bitrate } = params;
    let endpoint: string;
    let body: { wordId?: string; conversationId?: string; voice?: string; bitrate?: number };
    if (conversationId) {
      endpoint = API_ROUTES.conversationAudioGenerate;
      body = { conversationId, voice, bitrate };
    } else if (wordId) {
      endpoint = API_ROUTES.conversationAudioGenerate;
      body = { wordId, voice, bitrate };
    } else {
      throw new Error("Either wordId or conversationId must be provided");
    }
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`Audio generation failed: ${response.statusText}`);
    }
    const audio = await response.json();
    // For fetchAudioForWord, set conversationId to wordId for test compatibility
    if (wordId) {
      audio.conversationId = wordId;
    }
    return audio;
  }
}
