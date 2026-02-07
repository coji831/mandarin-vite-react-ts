/**
 * @file conversationService.ts
 * @description API service for conversation generation
 *
 * Story 14.5: Migrated to apiClient with full TypeScript type safety
 * Uses Axios with automatic token refresh and retry logic
 * Simplified: Removed duplicate backend classes, relies on Axios interceptors for resilience
 */

import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import { apiClient } from "services";
import { Conversation, ConversationGenerateRequest } from "../types";
import { IConversationBackend, IConversationService } from "./interfaces";

// ConversationService with DI support for testing
export class ConversationService implements IConversationService {
  constructor(private backend: IConversationBackend = new ConversationBackend()) {}

  async generateConversation(params: ConversationGenerateRequest): Promise<Conversation> {
    return this.backend.generateConversation(params);
  }
}

// Backend implementation using Axios with typed responses
export class ConversationBackend implements IConversationBackend {
  async generateConversation(params: ConversationGenerateRequest): Promise<Conversation> {
    try {
      // Backend returns conversation directly with _metadata (not wrapped in ApiResponse)
      const response = await apiClient.post<Conversation>(ROUTE_PATTERNS.conversations, {
        type: "text",
        ...params,
      });
      return response.data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("[ConversationBackend] generateConversation error", {
        error: message,
        endpoint: ROUTE_PATTERNS.conversations,
      });
      throw new Error("Failed to generate conversation. Please try again.");
    }
  }
}
