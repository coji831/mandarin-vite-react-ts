// __tests__/audioService.test.ts
// Unit tests for AudioService (Epic 11, Story 11.3)

import { ConversationAudio, WordAudio } from "features/mandarin/types";
import { API_ROUTES } from "../../../../../shared/constants/apiPaths";
import { AudioService } from "../audioService";
import { IAudioBackend } from "../interfaces";

// Test subclass to allow backend injection
class TestAudioService extends AudioService {
  public setBackend(backend: IAudioBackend) {
    this.backend = backend;
  }
}

global.fetch = jest.fn((url: unknown, opts?: { body?: string }) => {
  const urlStr = String(url);
  const body = opts && opts.body ? JSON.parse(opts.body) : {};
  if (urlStr === API_ROUTES.conversationAudioGenerate) {
    // Conversation audio endpoint: expects params with wordId, returns conversationId
    const conversationId = body.wordId || "c1";
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ conversationId, audioUrl: "audio.mp3", generatedAt: "now" }),
    });
  }
  if (urlStr === API_ROUTES.ttsAudio) {
    // Word audio endpoint: expects { text: chinese }, returns audioUrl
    const wordId = body.text || "w1";
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ audioUrl: "audio.mp3", wordId, generatedAt: "now" }),
    });
  }
  return Promise.reject("Unknown URL");
}) as typeof fetch;

describe("AudioService", () => {
  let service: TestAudioService;

  beforeEach(async () => {
    service = new TestAudioService();
  });

  it("fetchConversationAudio returns audio data", async () => {
    try {
      const params = { wordId: "c1", voice: "voiceA", bitrate: 128 };
      const audio = await service.fetchConversationAudio(params);
      expect(audio.conversationId).toBe("c1");
      expect(audio.audioUrl).toBe("audio.mp3");
    } catch (err) {
      console.error("Test error:", err);
      throw err;
    }
  });

  it("fetchWordAudio returns audio data", async () => {
    try {
      const params = { chinese: "w1", voice: "voiceB", bitrate: 64 };
      const audio = await service.fetchWordAudio(params);
      expect(audio.audioUrl).toBe("audio.mp3");
    } catch (err) {
      console.error("Test error:", err);
      throw err;
    }
  });

  it("uses fallbackService for fetchConversationAudio on error", async () => {
    const fallback = new AudioService();
    fallback.fetchConversationAudio = jest.fn(() =>
      Promise.resolve({
        conversationId: "fallback",
        audioUrl: "fallback.mp3",
        generatedAt: "now",
      } as ConversationAudio)
    );
    service.fallbackService = fallback;
    (global.fetch as jest.Mock).mockImplementationOnce(() => Promise.reject("fail"));
    const params = { wordId: "c2" };
    const audio = await service.fetchConversationAudio(params);
    expect(audio.conversationId).toBe("fallback");
  });

  it("uses fallbackService for fetchWordAudio on error", async () => {
    const fallback = new AudioService();
    fallback.fetchWordAudio = jest.fn(() =>
      Promise.resolve({
        audioUrl: "fallback.mp3",
      } as WordAudio)
    );
    service.fallbackService = fallback;
    // Simulate error by making fetchWordAudio throw
    // Use test subclass to inject backend
    service.setBackend({
      fetchWordAudio: () => Promise.reject(new Error("fail")),
      fetchConversationAudio: jest.fn(),
    });
    const params = { chinese: "w2" };
    const audio = await service.fetchWordAudio(params);
    expect(audio.audioUrl).toBe("fallback.mp3");
  });

  it("supports backend swap via DI", async () => {
    // Custom backend mock
    const customBackend = {
      fetchWordAudio: jest.fn(() =>
        Promise.resolve({
          audioUrl: "custom.mp3",
        })
      ),
      fetchConversationAudio: jest.fn((params) =>
        Promise.resolve({
          conversationId: params.wordId || "custom",
          audioUrl: "custom.mp3",
          generatedAt: "now",
        })
      ),
    };
    const svc = new AudioService(customBackend);
    const paramsWord = { chinese: "w99" };
    const paramsConv = { wordId: "c99" };
    const audio1 = await svc.fetchWordAudio(paramsWord);
    expect(audio1.audioUrl).toBe("custom.mp3");
    const audio2 = await svc.fetchConversationAudio(paramsConv);
    expect(audio2.audioUrl).toBe("custom.mp3");
    expect(audio2.conversationId).toBe("c99");
  });
});
