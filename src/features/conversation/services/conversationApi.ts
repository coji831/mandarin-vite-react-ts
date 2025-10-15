// src/features/conversation/services/conversationApi.ts

import { API_ROUTES } from "../../../../shared/constants/apiPaths";
import { Conversation } from "../types";
export async function generateConversation(params: {
  wordId: string;
  word: string;
  generatorVersion?: string;
}): Promise<Conversation> {
  // Always use unified /conversation endpoint from shared constants
  const endpoint = API_ROUTES.conversationTextGenerate;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Conversation generation failed: ${response.statusText}`);
  }

  return response.json();
}
