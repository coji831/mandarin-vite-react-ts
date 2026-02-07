/**
 * @file audioService.test.ts
 * @description Unit tests for AudioService (Story 14.6)
 *
 * Tests migration to apiClient with Axios, typed responses, and error handling
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import MockAdapter from "axios-mock-adapter";
import { apiClient } from "../../../../services/axiosClient";
import { AudioService, DefaultAudioBackend, LocalAudioBackend } from "../audioService";
import type { WordAudio, TurnAudioResponse } from "@mandarin/shared-types";

describe("AudioService (Story 14.6)", () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(apiClient);
  });

  afterEach(() => {
    mock.restore();
  });

  const mockWordAudio: WordAudio = {
    audioUrl: "https://storage.example.com/audio/hello.mp3",
    text: "你好",
    languageCode: "zh-CN",
    voiceName: "zh-CN-Wavenet-A",
  };

  const mockTurnAudio: TurnAudioResponse = {
    audioUrl: "https://storage.example.com/audio/turn1.mp3",
  };

  describe("DefaultAudioBackend", () => {
    it("should fetch word audio with typed response", async () => {
      mock.onPost("/api/v1/tts").reply(200, {
        success: true,
        data: mockWordAudio,
      });

      const backend = new DefaultAudioBackend();
      const result = await backend.fetchWordAudio({ chinese: "你好" });

      expect(result).toEqual(mockWordAudio);
      expect(result.audioUrl).toBe("https://storage.example.com/audio/hello.mp3");
    });

    it("should throw user-friendly error on failure", async () => {
      mock.onPost("/api/v1/tts").reply(500);

      const backend = new DefaultAudioBackend();
      await expect(backend.fetchWordAudio({ chinese: "你好" })).rejects.toThrow(
        "Failed to generate audio",
      );
    });

    it("should throw user-friendly error on network failure", async () => {
      mock.onPost("/api/v1/tts").networkError();

      const backend = new DefaultAudioBackend();
      await expect(backend.fetchWordAudio({ chinese: "你好" })).rejects.toThrow(
        "Failed to generate audio",
      );
    });

    it("should fetch turn audio with typed response", async () => {
      mock.onPost("/api/v1/conversations").reply(200, {
        success: true,
        data: mockTurnAudio,
      });

      const backend = new DefaultAudioBackend();
      const result = await backend.fetchTurnAudio({
        wordId: "word1",
        turnIndex: 0,
        text: "你好！",
      });

      expect(result.audioUrl).toBe("https://storage.example.com/audio/turn1.mp3");
    });

    it("should throw error on turn audio failure", async () => {
      mock.onPost("/api/v1/conversations").reply(500);

      const backend = new DefaultAudioBackend();
      await expect(
        backend.fetchTurnAudio({
          wordId: "word1",
          turnIndex: 0,
          text: "你好！",
        }),
      ).rejects.toThrow("Failed to generate conversation audio");
    });
  });

  describe("LocalAudioBackend", () => {
    it("should fetch word audio with typed response", async () => {
      mock.onPost("/api/v1/tts").reply(200, {
        success: true,
        data: mockWordAudio,
      });

      const backend = new LocalAudioBackend();
      const result = await backend.fetchWordAudio({ chinese: "你好" });

      expect(result).toEqual(mockWordAudio);
    });

    it("should throw user-friendly error on failure", async () => {
      mock.onPost("/api/v1/tts").reply(500);

      const backend = new LocalAudioBackend();
      await expect(backend.fetchWordAudio({ chinese: "你好" })).rejects.toThrow(
        "Failed to generate audio",
      );
    });

    it("should fetch turn audio", async () => {
      mock.onPost("/api/v1/conversations").reply(200, {
        success: true,
        data: mockTurnAudio,
      });

      const backend = new LocalAudioBackend();
      const result = await backend.fetchTurnAudio({
        wordId: "word1",
        turnIndex: 0,
        text: "你好！",
      });

      expect(result.audioUrl).toBe("https://storage.example.com/audio/turn1.mp3");
    });
  });

  describe("AudioService with fallback", () => {
    it("should use primary backend on success", async () => {
      mock.onPost("/api/v1/tts").reply(200, {
        success: true,
        data: mockWordAudio,
      });

      const service = new AudioService();
      const result = await service.fetchWordAudio({ chinese: "你好" });

      expect(result).toEqual(mockWordAudio);
    });

    it("should use LocalBackend on DefaultBackend failure", async () => {
      const localAudio: WordAudio = {
        ...mockWordAudio,
        audioUrl: "https://storage.example.com/audio/fallback.mp3",
      };

      // First call (DefaultBackend) fails, second call (LocalBackend) succeeds
      mock
        .onPost("/api/v1/tts")
        .replyOnce(500)
        .onPost("/api/v1/tts")
        .replyOnce(200, {
          success: true,
          data: localAudio,
        });

      const service = new AudioService();
      const result = await service.fetchWordAudio({ chinese: "你好" });

      expect(result.audioUrl).toBe("https://storage.example.com/audio/fallback.mp3");
    });

    it("should throw if both backends fail", async () => {
      mock.onPost("/api/v1/tts").reply(500);

      const service = new AudioService();
      await expect(service.fetchWordAudio({ chinese: "你好" })).rejects.toThrow(
        "Failed to generate audio",
      );
    });

    it("should use fallback for turn audio", async () => {
      const localTurnAudio: TurnAudioResponse = {
        audioUrl: "https://storage.example.com/audio/fallback-turn.mp3",
      };

      mock
        .onPost("/api/v1/conversations")
        .replyOnce(500)
        .onPost("/api/v1/conversations")
        .replyOnce(200, {
          success: true,
          data: localTurnAudio,
        });

      const service = new AudioService();
      const result = await service.fetchTurnAudio({
        wordId: "word1",
        turnIndex: 0,
        text: "你好！",
      });

      expect(result.audioUrl).toBe("https://storage.example.com/audio/fallback-turn.mp3");
    });
  });

  describe("Legacy fetchConversationAudio", () => {
    it("should throw error with migration notice", async () => {
      const service = new AudioService();
      await expect(
        service.fetchConversationAudio({ conversationId: "conv1" }),
      ).rejects.toThrow("Use fetchTurnAudio instead");
    });
  });

  describe("Type safety", () => {
    it("should provide TypeScript autocomplete for WordAudio fields", async () => {
      mock.onPost("/api/v1/tts").reply(200, {
        success: true,
        data: mockWordAudio,
      });

      const backend = new DefaultAudioBackend();
      const result = await backend.fetchWordAudio({ chinese: "你好" });

      // TypeScript should allow accessing these fields without errors
      expect(result.audioUrl).toBeDefined();
      expect(result.text).toBeDefined();
      expect(result.languageCode).toBeDefined();
      expect(result.voiceName).toBeDefined();
    });
  });
});

    const audio = await service.fetchWordAudio(params);
    expect(audio.audioUrl).toBe("fallback.mp3");
  });

  it("supports backend swap via DI", async () => {
    // Custom backend mock
    const customBackend = {
      fetchWordAudio: vi.fn(() =>
        Promise.resolve({
          audioUrl: "custom.mp3",
        })
      ),
      fetchTurnAudio: vi.fn(() =>
        Promise.resolve({
          audioUrl: "custom.mp3",
        })
      ),
      fetchConversationAudio: vi.fn((params) =>
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
