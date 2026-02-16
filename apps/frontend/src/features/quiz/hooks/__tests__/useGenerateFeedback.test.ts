/**
 * Tests for AI Feedback Generation Hook
 * Story 15.9: Gamification & AI Integration
 *
 * Tests useGenerateFeedback hook with:
 * - Successful feedback generation
 * - 3-second timeout mechanism
 * - Error handling with fallback messages
 * - Loading states
 * - AbortController integration
 */

import { renderHook, waitFor } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import { apiClient } from "../../../../services/axiosClient";
import { FeedbackResponse, useGenerateFeedback } from "../useAIFeedback";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";

// ============================================================================
// Mock Setup
// ============================================================================

const mock = new MockAdapter(apiClient);

const mockFeedbackResponse: FeedbackResponse = {
  explanation:
    "The correct answer is 'nǐ hǎo' (你好). Remember that both syllables use the third tone (ˇ). Try practicing tone combinations to improve accuracy.",
  errorType: "tone",
};

describe("useGenerateFeedback", () => {
  beforeEach(() => {
    mock.reset();
    vi.clearAllTimers();
  });

  afterEach(() => {
    mock.reset();
  });

  it("should initialize with loading=false and error=null", () => {
    const { result } = renderHook(() => useGenerateFeedback());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it("should generate AI feedback successfully", async () => {
    mock.onPost(ROUTE_PATTERNS.quizFeedback).reply(200, mockFeedbackResponse);

    const { result } = renderHook(() => useGenerateFeedback());

    const request = {
      wordId: "hsk3-band1-001",
      questionType: "type_pinyin" as const,
      userAnswer: "ni hao",
      correctAnswer: "nǐ hǎo",
    };

    const feedback = await result.current.generateFeedback(request);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(feedback.explanation).toBe(mockFeedbackResponse.explanation);
    expect(feedback.errorType).toBe("tone");
    expect(result.current.error).toBe(null);
  });

  it("should handle loading state during generation", async () => {
    mock.onPost(ROUTE_PATTERNS.quizFeedback).reply(() => {
      return new Promise((resolve) => {
        setTimeout(() => resolve([200, mockFeedbackResponse]), 50);
      });
    });

    const { result } = renderHook(() => useGenerateFeedback());

    const request = {
      wordId: "hsk3-band1-001",
      questionType: "type_pinyin" as const,
      userAnswer: "ni hao",
      correctAnswer: "nǐ hǎo",
    };

    result.current.generateFeedback(request);

    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it("should return fallback message on timeout (3s)", async () => {
    // Mock slow response (4 seconds - exceeds timeout)
    mock.onPost(ROUTE_PATTERNS.quizFeedback).reply(() => {
      return new Promise((resolve) => {
        setTimeout(() => resolve([200, mockFeedbackResponse]), 4000);
      });
    });

    const { result } = renderHook(() => useGenerateFeedback());

    const request = {
      wordId: "hsk3-band1-001",
      questionType: "type_pinyin" as const,
      userAnswer: "ni hao",
      correctAnswer: "nǐ hǎo",
    };

    const feedbackPromise = result.current.generateFeedback(request);

    // Wait for timeout
    await new Promise((resolve) => setTimeout(resolve, 3100));

    const feedback = await feedbackPromise;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should return fallback message
    expect(feedback.explanation).toContain("Keep practicing");
    expect(feedback.errorType).toBe("generic");
    expect(result.current.error).toBe("Timeout");
  });

  it("should return fallback message on 401 error", async () => {
    mock.onPost(ROUTE_PATTERNS.quizFeedback).reply(401, { error: "Unauthorized" });

    const { result } = renderHook(() => useGenerateFeedback());

    const request = {
      wordId: "hsk3-band1-001",
      questionType: "type_pinyin" as const,
      userAnswer: "ni hao",
      correctAnswer: "nǐ hǎo",
    };

    const feedback = await result.current.generateFeedback(request);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should return fallback message on error
    expect(feedback.explanation).toContain("Keep practicing");
    expect(feedback.errorType).toBe("generic");
    expect(result.current.error).toBeTruthy();
  });

  it("should return fallback message on 500 error", async () => {
    mock.onPost(ROUTE_PATTERNS.quizFeedback).reply(500, { error: "AI service unavailable" });

    const { result } = renderHook(() => useGenerateFeedback());

    const request = {
      wordId: "hsk3-band1-001",
      questionType: "type_pinyin" as const,
      userAnswer: "ni hao",
      correctAnswer: "nǐ hǎo",
    };

    const feedback = await result.current.generateFeedback(request);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(feedback.explanation).toContain("Keep practicing");
    expect(feedback.errorType).toBe("generic");
    expect(result.current.error).toBeTruthy();
  });

  it("should return fallback message on network error", async () => {
    mock.onPost(ROUTE_PATTERNS.quizFeedback).networkError();

    const { result } = renderHook(() => useGenerateFeedback());

    const request = {
      wordId: "hsk3-band1-001",
      questionType: "type_pinyin" as const,
      userAnswer: "ni hao",
      correctAnswer: "nǐ hǎo",
    };

    const feedback = await result.current.generateFeedback(request);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(feedback.explanation).toContain("Keep practicing");
    expect(feedback.errorType).toBe("generic");
    expect(result.current.error).toBeTruthy();
  });

  it("should handle multiple concurrent requests", async () => {
    mock.onPost(ROUTE_PATTERNS.quizFeedback).reply((config) => {
      const body = JSON.parse(config.data);
      return [
        200,
        {
          explanation: `Feedback for ${body.wordId}`,
          errorType: "generic",
        },
      ];
    });

    const { result } = renderHook(() => useGenerateFeedback());

    const request1 = {
      wordId: "hsk3-band1-001",
      questionType: "type_pinyin" as const,
      userAnswer: "ni hao",
      correctAnswer: "nǐ hǎo",
    };

    const request2 = {
      wordId: "hsk3-band1-042",
      questionType: "type_character" as const,
      userAnswer: "谢谢",
      correctAnswer: "谢谢",
    };

    const [feedback1, feedback2] = await Promise.all([
      result.current.generateFeedback(request1),
      result.current.generateFeedback(request2),
    ]);

    expect(feedback1.explanation).toContain("hsk3-band1-001");
    expect(feedback2.explanation).toContain("hsk3-band1-042");
  });

  it("should send correct payload structure", async () => {
    let receivedPayload: any = null;

    mock.onPost(ROUTE_PATTERNS.quizFeedback).reply((config) => {
      receivedPayload = JSON.parse(config.data);
      return [200, mockFeedbackResponse];
    });

    const { result } = renderHook(() => useGenerateFeedback());

    const request = {
      wordId: "hsk3-band1-001",
      questionType: "type_pinyin" as const,
      userAnswer: "ni hao",
      correctAnswer: "nǐ hǎo",
    };

    await result.current.generateFeedback(request);

    await waitFor(() => {
      expect(receivedPayload).not.toBeNull();
    });

    expect(receivedPayload.wordId).toBe("hsk3-band1-001");
    expect(receivedPayload.questionType).toBe("type_pinyin");
    expect(receivedPayload.userAnswer).toBe("ni hao");
    expect(receivedPayload.correctAnswer).toBe("nǐ hǎo");
  });

  it("should handle different error types", async () => {
    const toneError: FeedbackResponse = {
      explanation: "Focus on tone marks",
      errorType: "tone",
    };

    mock.onPost(ROUTE_PATTERNS.quizFeedback).reply(200, toneError);

    const { result } = renderHook(() => useGenerateFeedback());

    const request = {
      wordId: "hsk3-band1-001",
      questionType: "type_pinyin" as const,
      userAnswer: "ni hao",
      correctAnswer: "nǐ hǎo",
    };

    const feedback = await result.current.generateFeedback(request);

    expect(feedback.errorType).toBe("tone");
    expect(feedback.explanation).toContain("tone marks");
  });

  it("should clear error state on successful request", async () => {
    // First: error
    mock.onPost(ROUTE_PATTERNS.quizFeedback).replyOnce(500);

    const { result } = renderHook(() => useGenerateFeedback());

    const request = {
      wordId: "hsk3-band1-001",
      questionType: "type_pinyin" as const,
      userAnswer: "ni hao",
      correctAnswer: "nǐ hǎo",
    };

    await result.current.generateFeedback(request);

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    // Second: success
    mock.onPost(ROUTE_PATTERNS.quizFeedback).replyOnce(200, mockFeedbackResponse);

    await result.current.generateFeedback(request);

    await waitFor(() => {
      expect(result.current.error).toBe(null);
    });
  });
});
