/**
 * @file audioService.test.ts
 * @description Unit tests for AudioService (Story 14.6)
 *
 * Tests migration to apiClient with Axios, typed responses, and error handling
 * Simplified: Removed duplicate backend tests, relies on Axios interceptors for resilience
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import MockAdapter from "axios-mock-adapter";
import { apiClient } from "../../../../services/axiosClient";
import { AudioService, AudioBackend } from "../audioService";
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

  describe("AudioBackend", () => {
    it("should fetch word audio with typed response", async () => {
      // Backend returns data directly (not wrapped)
      mock.onPost("/v1/tts").reply(200, mockWordAudio);

      const backend = new AudioBackend();
      const result = await backend.fetchWordAudio({ chinese: "你好" });

      expect(result).toEqual(mockWordAudio);
      expect(result.audioUrl).toBe("https://storage.example.com/audio/hello.mp3");
    });

    it("should throw user-friendly error on failure", async () => {
      mock.onPost("/v1/tts").reply(500);

      const backend = new AudioBackend();
      await expect(backend.fetchWordAudio({ chinese: "你好" })).rejects.toThrow(
        "Failed to generate audio",
      );
    });

    it("should throw user-friendly error on network failure", async () => {
      mock.onPost("/v1/tts").networkError();

      const backend = new AudioBackend();
      await expect(backend.fetchWordAudio({ chinese: "你好" })).rejects.toThrow(
        "Failed to generate audio",
      );
    });

    it("should fetch turn audio with typed response", async () => {
      // Backend returns data directly (not wrapped)
      mock.onPost("/v1/conversations").reply(200, mockTurnAudio);

      const backend = new AudioBackend();
      const result = await backend.fetchTurnAudio({
        wordId: "word1",
        turnIndex: 0,
        text: "你好！",
      });

      expect(result.audioUrl).toBe("https://storage.example.com/audio/turn1.mp3");
    });

    it("should throw error on turn audio failure", async () => {
      mock.onPost("/v1/conversations").reply(500);

      const backend = new AudioBackend();
      await expect(
        backend.fetchTurnAudio({
          wordId: "word1",
          turnIndex: 0,
          text: "你好！",
        }),
      ).rejects.toThrow("Failed to generate conversation audio");
    });
  });

  describe("AudioService", () => {
    it("should delegate to backend successfully", async () => {
      // Backend returns data directly (not wrapped)
      mock.onPost("/v1/tts").reply(200, mockWordAudio);

      const service = new AudioService();
      const result = await service.fetchWordAudio({ chinese: "你好" });

      expect(result).toEqual(mockWordAudio);
    });

    it("should allow custom backend via DI", async () => {
      // Backend returns data directly (not wrapped)
      mock.onPost("/v1/tts").reply(200, mockWordAudio);

      const customBackend = new AudioBackend();
      const service = new AudioService(customBackend);
      const result = await service.fetchWordAudio({ chinese: "你好" });

      expect(result).toEqual(mockWordAudio);
    });

    it("should delegate turn audio to backend", async () => {
      // Backend returns data directly (not wrapped)
      mock.onPost("/v1/conversations").reply(200, mockTurnAudio);

      const service = new AudioService();
      const result = await service.fetchTurnAudio({
        wordId: "word1",
        turnIndex: 0,
        text: "你好！",
      });

      expect(result.audioUrl).toBe("https://storage.example.com/audio/turn1.mp3");
    });
  });

  describe("Legacy fetchConversationAudio", () => {
    it("should throw error with migration notice", async () => {
      const service = new AudioService();
      await expect(service.fetchConversationAudio({ wordId: "conv1" })).rejects.toThrow(
        "Use fetchTurnAudio instead",
      );
    });
  });

  describe("Type safety", () => {
    it("should provide TypeScript autocomplete for WordAudio fields", async () => {
      // Backend returns data directly (not wrapped)
      mock.onPost("/v1/tts").reply(200, mockWordAudio);

      const backend = new AudioBackend();
      const result = await backend.fetchWordAudio({ chinese: "你好" });

      // TypeScript should allow accessing these fields without errors
      expect(result.audioUrl).toBeDefined();
      expect(result.audioUrl).toBe("https://storage.example.com/audio/hello.mp3");
    });
  });
});
