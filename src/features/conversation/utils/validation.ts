// Validation utilities for Conversation schema
import { Conversation, ConversationTurn } from "../types/conversation";

export function isValidConversation(data: unknown): data is Conversation {
  const conv = data as Conversation;
  return (
    typeof conv?.id === "string" &&
    typeof conv?.wordId === "string" &&
    typeof conv?.word === "string" &&
    Array.isArray(conv?.turns) &&
    conv.turns.length >= 3 &&
    conv.turns.length <= 5 &&
    conv.turns.every(isValidTurn) &&
    typeof conv?.generatedAt === "string" &&
    typeof conv?.generatorVersion === "string"
  );
}

export function isValidTurn(turn: unknown): turn is ConversationTurn {
  const t = turn as ConversationTurn;
  return (
    typeof t?.speaker === "string" &&
    typeof t?.text === "string" &&
    t.text.length > 0 &&
    t.text.length <= 200
  );
}
