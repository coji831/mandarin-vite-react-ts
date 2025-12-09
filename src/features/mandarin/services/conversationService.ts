// Fallback backend for local development
export class LocalConversationBackend implements IConversationBackend {
  async generateConversation(params: ConversationGenerateRequest): Promise<Conversation> {
    const endpoint = "http://localhost:3001" + API_ROUTES.conversation;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "text", ...params }),
    });
    if (!response.ok) {
      throw new Error(`Conversation generation failed (local): ${response.statusText}`);
    }
    return response.json();
  }
}
import { API_ROUTES } from "../../../../shared/constants/apiPaths";
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
    const endpoint = API_ROUTES.conversation;
    const response = await fetch(endpoint, {
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
