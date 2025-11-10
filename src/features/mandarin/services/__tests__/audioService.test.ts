// __tests__/audioService.test.ts
// Unit tests for AudioService (Epic 11, Story 11.3)

import { AudioService } from "../audioService";
import { ConversationAudio } from "../../types/Conversation";
import { API_ROUTES } from "../../../../../shared/constants/apiPaths";

global.fetch = jest.fn((url: string, opts: any) => {
  if (url === API_ROUTES.conversationAudioGenerate) {
    // Parse the request body to extract conversationId or wordId
    const body = opts && opts.body ? JSON.parse(opts.body) : {};
    const conversationId = body.conversationId || body.wordId || "c1";
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ conversationId, audioUrl: "audio.mp3", generatedAt: "now" }),
    });
  }
  return Promise.reject("Unknown URL");
}) as any;

describe("AudioService", () => {
  let service: AudioService;

  beforeEach(async () => {
    service = new AudioService();
  });

  it("fetchAudioForConversation returns audio data", async () => {
    try {
      const audio = await service.fetchAudioForConversation("c1", "voiceA", 128);
      expect(audio.conversationId).toBe("c1");
      expect(audio.audioUrl).toBe("audio.mp3");
    } catch (err) {
      console.error("Test error:", err);
      throw err;
    }
  });

  it("fetchAudioForWord returns audio data", async () => {
    try {
      const audio = await service.fetchAudioForWord("w1", "voiceB", 64);
      expect(audio.audioUrl).toBe("audio.mp3");
    } catch (err) {
      console.error("Test error:", err);
      throw err;
    }
  });

  it("uses fallbackService for fetchAudioForConversation on error", async () => {
    const fallback = new AudioService();
    fallback.fetchAudioForConversation = jest.fn(() =>
      Promise.resolve({
        conversationId: "fallback",
        audioUrl: "fallback.mp3",
        generatedAt: "now",
      } as ConversationAudio)
    );
    service.fallbackService = fallback;
    (global.fetch as jest.Mock).mockImplementationOnce(() => Promise.reject("fail"));
    const audio = await service.fetchAudioForConversation("c2");
    expect(audio.conversationId).toBe("fallback");
  });

  it("uses fallbackService for fetchAudioForWord on error", async () => {
    const fallback = new AudioService();
    fallback.fetchAudioForWord = jest.fn(() =>
      Promise.resolve({
        conversationId: "fallback",
        audioUrl: "fallback.mp3",
        generatedAt: "now",
      } as ConversationAudio)
    );
    service.fallbackService = fallback;
    service.fetch = jest.fn(() => {
      throw new Error("fail");
    });
    const audio = await service.fetchAudioForWord("w2");
    expect(audio.audioUrl).toBe("fallback.mp3");
  });

  it("supports backend swap via DI", async () => {
    // Custom backend mock
    const customBackend = {
      fetchAudio: jest.fn((params) =>
        Promise.resolve({
          conversationId: params.wordId || params.conversationId || "custom",
          audioUrl: "custom.mp3",
          generatedAt: "now",
        })
      ),
    };
    const svc = new AudioService(customBackend);
    const audio1 = await svc.fetchAudioForWord("w99");
    expect(audio1.audioUrl).toBe("custom.mp3");
    expect(audio1.conversationId).toBe("w99");
    const audio2 = await svc.fetchAudioForConversation("c99");
    expect(audio2.audioUrl).toBe("custom.mp3");
    expect(audio2.conversationId).toBe("c99");
  });
});
