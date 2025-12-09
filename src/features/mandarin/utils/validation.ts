// Validation utilities for Conversation schema
import { Conversation, ConversationTurn } from "../types";

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
    // generatorVersion is optional metadata
    (typeof conv?.generatorVersion === "string" || typeof conv?.generatorVersion === "undefined")
  );
}

export function isValidTurn(turn: unknown): turn is ConversationTurn {
  const t = turn as ConversationTurn;
  return (
    typeof t?.speaker === "string" &&
    typeof t?.chinese === "string" &&
    t.chinese.length > 0 &&
    t.chinese.length <= 200
  );
}
