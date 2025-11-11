import { API_ROUTES } from "../../../../shared/constants/apiPaths";
import { Conversation, ConversationGenerateRequest } from "../types";
import { IConversationBackend, IConversationService } from "./interfaces";

// Default backend implementation using fetch
export class ConversationService implements IConversationService {
  private backend: IConversationBackend;
  declare fallbackService?: ConversationService;

  constructor(backend?: IConversationBackend) {
    this.backend = backend || new DefaultConversationBackend();
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
    const endpoint = API_ROUTES.conversationTextGenerate;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!response.ok) {
      throw new Error(`Conversation generation failed: ${response.statusText}`);
    }
    return response.json();
  }
}
