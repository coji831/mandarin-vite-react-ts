/**
 * @file conversationService.ts
 * @description API service for conversation generation
 *
 * Story 14.5: Migrated to apiClient with full TypeScript type safety
 * Uses Axios with automatic token refresh and retry logic
 */

import { apiClient } from "../../../services/axiosClient";
import type { ConversationApiResponse } from "@mandarin/shared-types";

// Fallback backend for local development
export class LocalConversationBackend implements IConversationBackend {
  async generateConversation(params: ConversationGenerateRequest): Promise<Conversation> {
    try {
      const response = await apiClient.post<ConversationApiResponse>(API_ENDPOINTS.CONVERSATION, {
        type: "text",
        ...params,
      });
      return response.data.data;
    } catch (error: any) {
      console.error("LocalConversationBackend.generateConversation error", {
        error: error.message,
        endpoint: API_ENDPOINTS.CONVERSATION,
      });
      throw new Error("Failed to generate conversation. Please try again.");
    }
  }
}
import { API_ENDPOINTS } from "@mandarin/shared-constants";
import { Conversation, ConversationGenerateRequest } from "../types";
import { IConversationBackend, IConversationService } from "./interfaces";

// Default backend implementation using fetch
export class ConversationService implements IConversationService {
  private backend: IConversationBackend;
  declare fallbackService?: ConversationService;

  constructor(backend?: IConversationBackend, withFallback = true) {
    this.backend = backend || new DefaultConversationBackend();
    if (withFallback) {
      this.fallbackService = new ConversationService(new LocalConversationBackend(), false);
    }
  }

  async generateConversation(params: ConversationGenerateRequest): Promise<Conversation> {
    try {
      return await this.backend.generateConversation(params);
    } catch (err) {
      if (!this.fallbackService) throw err;
      return this.fallbackService.generateConversation(params);
    }
  }
}

// Default backend implementation using Axios
export class DefaultConversationBackend implements IConversationBackend {
  async generateConversation(params: ConversationGenerateRequest): Promise<Conversation> {
    try {
      const response = await apiClient.post<ConversationApiResponse>(API_ENDPOINTS.CONVERSATION, {
        type: "text",
        ...params,
      });
      return response.data.data;
    } catch (error: any) {
      console.error("DefaultConversationBackend.generateConversation error", {
        error: error.message,
        endpoint: API_ENDPOINTS.CONVERSATION,
      });
      throw new Error("Failed to generate conversation. Please try again.");
    }
  }
}
