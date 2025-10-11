// src/features/conversation/services/conversationApi.ts

import { Conversation } from "../types";

const API_BASE = process.env.NODE_ENV === "development" ? "http://localhost:3001/api" : "/api";

export async function generateConversation(params: {
  wordId: string;
  word?: string;
  generatorVersion?: string;
  useScaffolder?: boolean;
}): Promise<Conversation> {
  const endpoint =
    params.useScaffolder || process.env.NODE_ENV === "development"
      ? "/scaffold/conversation"
      : "/generator/conversation";

  const response = await fetch(`${API_BASE}${endpoint}`, {
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
