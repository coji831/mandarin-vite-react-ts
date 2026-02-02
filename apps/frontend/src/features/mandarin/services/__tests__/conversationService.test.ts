import { vi } from "vitest";
// __tests__/conversationService.test.ts
// Unit tests for ConversationService (Epic 11, Story 11.2)

import { Conversation, ConversationGenerateRequest } from "../../types";
import { ConversationService } from "../conversationService";
import { IConversationBackend } from "../interfaces";

const mockConversation: Conversation = {
  id: "1",
  wordId: "w1",
  word: "你好",
  turns: [],
  generatedAt: "now",
};

global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    statusText: "OK",
    json: () => Promise.resolve(mockConversation),
  }),
) as unknown as typeof fetch;

describe("ConversationService", () => {
  let service: ConversationService;

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn((url: unknown) => {
      // Debug: log the URL used in fetch

      console.log("fetch called with URL:", url);
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: "OK",
        json: () => Promise.resolve(mockConversation),
      });
    }) as unknown as typeof fetch;
    service = new ConversationService();
  });

  it("generateConversation returns conversation data", async () => {
    const params: ConversationGenerateRequest = { wordId: "w1", word: "你好" };
    const conv = await service.generateConversation(params);
    expect(conv.id).toBe("1");
    expect(conv.word).toBe("你好");
  });

  it("uses fallbackService on error", async () => {
    const fallback = new ConversationService();
    fallback.generateConversation = vi.fn(() =>
      Promise.resolve({ ...mockConversation, id: "fallback" }),
    );
    service.fallbackService = fallback;
    (global.fetch as any).mockImplementationOnce(() => Promise.reject("fail"));
    const params: ConversationGenerateRequest = { wordId: "w2", word: "hello" };
    const conv = await service.generateConversation(params);
    expect(conv.id).toBe("fallback");
  });

  it("supports backend swap via DI", async () => {
    const customBackend: IConversationBackend = {
      generateConversation: vi.fn((params: ConversationGenerateRequest) =>
        Promise.resolve({ ...mockConversation, id: "custom", word: params.word }),
      ),
    };
    const svc = new ConversationService(customBackend);
    const params: ConversationGenerateRequest = { wordId: "w3", word: "custom" };
    const conv = await svc.generateConversation(params);
    expect(conv.id).toBe("custom");
    expect(conv.word).toBe("custom");
  });
});
