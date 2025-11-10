import { IConversationService } from "./interfaces";
import { Conversation } from "../types/Conversation";
import { API_ROUTES } from "../../../../shared/constants/apiPaths";

// Backend interface for DI/configurable backend swap
export interface IConversationBackend {
  generateConversation(params: {
    wordId: string;
    word: string;
    generatorVersion?: string;
  }): Promise<Conversation>;
}

// Default backend implementation using fetch
export class DefaultConversationBackend implements IConversationBackend {
  async generateConversation(params: {
    wordId: string;
    word: string;
    generatorVersion?: string;
  }): Promise<Conversation> {
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

export class ConversationService implements IConversationService {
  private backend: IConversationBackend;
  constructor(backend?: IConversationBackend) {
    this.backend = backend || new DefaultConversationBackend();
  }
  async generateConversation(params: {
    wordId: string;
    word: string;
    generatorVersion?: string;
  }): Promise<Conversation> {
    return this.backend.generateConversation(params);
  }
}
