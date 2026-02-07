/**
 * @file conversationService.test.ts
 * @description Unit tests for ConversationService (Story 14.5)
 *
 * Tests migration to apiClient with Axios, typed responses, and error handling
 * Simplified: Removed duplicate backend tests, relies on Axios interceptors for resilience
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import MockAdapter from "axios-mock-adapter";
import { ConversationService, ConversationBackend } from "../conversationService";
import type { Conversation, ConversationGenerateRequest } from "@mandarin/shared-types";
import apiClient from "../../../../services/axiosClient";

describe("ConversationService (Story 14.5)", () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(apiClient);
  });

  afterEach(() => {
    mock.restore();
  });

  const mockConversation: Conversation = {
    id: "conv1",
    wordId: "word1",
    word: "你好",
    turns: [
      {
        speaker: "A",
        chinese: "你好！",
        pinyin: "Nǐ hǎo!",
        english: "Hello!",
        audioUrl: "https://example.com/audio1.mp3",
      },
      {
        speaker: "B",
        chinese: "你好！你叫什么名字？",
        pinyin: "Nǐ hǎo! Nǐ jiào shénme míngzi?",
        english: "Hello! What's your name?",
        audioUrl: "https://example.com/audio2.mp3",
      },
    ],
    generatedAt: "2026-02-07T00:00:00Z",
  };

  describe("ConversationBackend", () => {
    it("should generate conversation with typed response", async () => {
      mock.onPost("/v1/conversations").reply(200, {
        success: true,
        data: mockConversation,
      });

      const backend = new ConversationBackend();
      const params: ConversationGenerateRequest = { wordId: "word1", word: "你好" };
      const result = await backend.generateConversation(params);

      expect(result).toEqual(mockConversation);
      expect(result.turns).toHaveLength(2);
      expect(result.turns[0].chinese).toBe("你好！");
    });

    it("should throw user-friendly error on failure", async () => {
      mock.onPost("/v1/conversations").reply(500);

      const backend = new ConversationBackend();
      const params: ConversationGenerateRequest = { wordId: "word1", word: "你好" };

      await expect(backend.generateConversation(params)).rejects.toThrow(
        "Failed to generate conversation",
      );
    });

    it("should throw user-friendly error on network failure", async () => {
      mock.onPost("/v1/conversations").networkError();

      const backend = new ConversationBackend();
      const params: ConversationGenerateRequest = { wordId: "word1", word: "你好" };

      await expect(backend.generateConversation(params)).rejects.toThrow(
        "Failed to generate conversation",
      );
    });
  });

  describe("ConversationService", () => {
    it("should delegate to backend successfully", async () => {
      mock.onPost("/v1/conversations").reply(200, {
        success: true,
        data: mockConversation,
      });

      const service = new ConversationService();
      const params: ConversationGenerateRequest = { wordId: "word1", word: "你好" };
      const result = await service.generateConversation(params);

      expect(result).toEqual(mockConversation);
    });

    it("should allow custom backend via DI", async () => {
      mock.onPost("/v1/conversations").reply(200, {
        success: true,
        data: mockConversation,
      });

      const customBackend = new ConversationBackend();
      const service = new ConversationService(customBackend);
      const params: ConversationGenerateRequest = { wordId: "word1", word: "你好" };
      const result = await service.generateConversation(params);

      expect(result).toEqual(mockConversation);
    });
  });

  describe("Type safety", () => {
    it("should provide TypeScript autocomplete for Conversation fields", async () => {
      mock.onPost("/v1/conversations").reply(200, {
        success: true,
        data: mockConversation,
      });

      const backend = new ConversationBackend();
      const params: ConversationGenerateRequest = { wordId: "word1", word: "你好" };
      const result = await backend.generateConversation(params);

      // TypeScript should allow accessing these fields without errors
      expect(result.id).toBeDefined();
      expect(result.wordId).toBeDefined();
      expect(result.turns).toBeDefined();
      expect(result.turns[0].chinese).toBeDefined();
      expect(result.turns[0].pinyin).toBeDefined();
      expect(result.turns[0].english).toBeDefined();
    });
  });
});
