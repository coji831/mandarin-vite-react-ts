import { ApiClient } from "../../../services/apiClient";

// Fallback backend for local development
export class LocalConversationBackend implements IConversationBackend {
  async generateConversation(params: ConversationGenerateRequest): Promise<Conversation> {
    const endpoint = API_ENDPOINTS.CONVERSATION;
    try {
      const response = await ApiClient.publicRequest(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "text", ...params }),
      });
      if (!response.ok) {
        const text = await response.text().catch(() => "<unreadable>");
        console.error("Conversation generation failed (local)", {
          endpoint,
          status: response.status,
          body: text,
        });
        throw new Error(
          `Conversation generation failed (local): ${response.status} ${response.statusText} - ${text}`,
        );
      }
      return response.json();
    } catch (err) {
      console.error("LocalConversationBackend.generateConversation error", { err, endpoint });
      throw err;
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

// Default backend implementation using fetch
export class DefaultConversationBackend implements IConversationBackend {
  async generateConversation(params: ConversationGenerateRequest): Promise<Conversation> {
    const endpoint = API_ENDPOINTS.CONVERSATION;
    const response = await ApiClient.publicRequest(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "text", ...params }),
    });
    if (!response.ok) {
      throw new Error(`Conversation generation failed: ${response.statusText}`);
    }
    return response.json();
  }
}
