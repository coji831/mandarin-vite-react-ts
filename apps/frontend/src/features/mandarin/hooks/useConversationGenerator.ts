import { useCallback, useState } from "react";

import { ConversationService } from "../services";
import { Conversation, ConversationGenerateRequest } from "../types";

export function useConversationGenerator() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateConversation = useCallback(
    async (params: ConversationGenerateRequest): Promise<Conversation> => {
      setIsLoading(true);
      setError(null);
      try {
        const conversationService = new ConversationService();
        const conversation = await conversationService.generateConversation(params);
        return conversation;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    generateConversation,
    isLoading,
    error,
    clearError,
  };
}
