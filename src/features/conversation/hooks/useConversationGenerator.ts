import { useCallback, useState } from "react";

import { generateConversation as apiGenerateConversation } from "../services";
import type { Conversation } from "../types";

export function useConversationGenerator() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateConversation = useCallback(
    async (params: {
      wordId: string;
      word: string;
      generatorVersion?: string;
      useScaffolder?: boolean;
    }): Promise<Conversation> => {
      setIsLoading(true);
      setError(null);
      try {
        const conversation = await apiGenerateConversation(params);
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
