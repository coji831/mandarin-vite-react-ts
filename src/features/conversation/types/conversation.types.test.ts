// Unit tests for Conversation type guards and validation
import { isValidConversation, isValidTurn } from "../utils/validation";
import { Conversation, ConversationTurn } from "./conversation.types";

describe("Conversation type guards", () => {
  it("validates a correct Conversation object", () => {
    const valid: Conversation = {
      id: "hello-v1-abc123",
      wordId: "hello",
      word: "你好",
      meaning: "hello",
      context: "greeting",
      turns: [
        { speaker: "A", text: "你好！", translation: "Hello!" },
        { speaker: "B", text: "你好！很高兴见到你。", translation: "Hello! Nice to meet you." },
        { speaker: "A", text: "我也很高兴见到你。", translation: "Nice to meet you too." },
      ],
      generatedAt: "2025-10-10T12:00:00Z",
      generatorVersion: "v1",
      promptHash: "abc123def456",
    };
    expect(isValidConversation(valid)).toBe(true);
  });

  it("rejects a Conversation with too few turns", () => {
    const invalid: Conversation = {
      id: "bad-v1-xyz",
      wordId: "bad",
      word: "坏",
      turns: [],
      generatedAt: "2025-10-10T12:00:00Z",
      generatorVersion: "v1",
    };
    expect(isValidConversation(invalid)).toBe(false);
  });

  it("validates a correct ConversationTurn", () => {
    const turn: ConversationTurn = { speaker: "A", text: "你好！" };
    expect(isValidTurn(turn)).toBe(true);
  });

  it("rejects a ConversationTurn with empty text", () => {
    const turn: ConversationTurn = { speaker: "A", text: "" };
    expect(isValidTurn(turn)).toBe(false);
  });
});
