/**
 * Tests for Quiz API Hooks
 * Story 15.8: Core Quiz Backend Integration
 *
 * Tests both useFetchDueWords and useSaveTestResult hooks with:
 * - Successful requests
 * - Error handling
 * - Loading states
 * - Response validation
 */

import { renderHook, waitFor } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import { apiClient } from "../../../../services/axiosClient";
import {
  DueWordsResponse,
  TestResultResponse,
  useFetchDueWords,
  useSaveTestResult,
} from "../useQuizAPI";
import { describe, it, expect, beforeEach, afterEach } from "vitest";

// ============================================================================
// Mock Setup
// ============================================================================

const mock = new MockAdapter(apiClient);

const mockDueWordsResponse: DueWordsResponse = {
  date: "2026-02-14",
  count: 2,
  words: [
    {
      id: "hsk3-band1-001",
      simplified: "你好",
      traditional: "你好",
      pinyin: "nǐ hǎo",
      english: "hello",
      nextReview: "2026-02-12T08:00:00.000Z",
      studyCount: 5,
      lapseCount: 1,
      currentDelay: 3,
      categories: ["Greetings"],
    },
    {
      id: "hsk3-band1-042",
      simplified: "谢谢",
      traditional: "謝謝",
      pinyin: "xiè xie",
      english: "thank you",
      nextReview: "2026-02-13T08:00:00.000Z",
      studyCount: 3,
      lapseCount: 0,
      currentDelay: 7,
      categories: ["Greetings", "Politeness"],
    },
  ],
};

const mockTestResultResponse: TestResultResponse = {
  nextReviewDate: "2026-03-16T08:00:00.000Z",
  lapseCount: 0,
  isLeech: false,
  xpEarned: 15,
  newBadges: [
    {
      id: "bronze_flame",
      name: "Bronze Flame",
      streakRequired: 7,
      icon: "🔥",
    },
  ],
  freezeAwarded: false,
  mysteryBox: null,
};

// ============================================================================
// Tests: useFetchDueWords
// ============================================================================

describe("useFetchDueWords", () => {
  beforeEach(() => {
    mock.reset();
  });

  afterEach(() => {
    mock.reset();
  });

  it("should initialize with loading=false and error=null", () => {
    const { result } = renderHook(() => useFetchDueWords());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it("should fetch due words successfully", async () => {
    mock.onGet("/api/v1/progress/due").reply(200, mockDueWordsResponse);

    const { result } = renderHook(() => useFetchDueWords());

    let responseData: DueWordsResponse | undefined;
    await waitFor(async () => {
      responseData = await result.current.fetchDueWords();
    });

    expect(responseData).toEqual(mockDueWordsResponse);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it("should handle network errors", async () => {
    mock.onGet("/api/v1/progress/due").networkError();

    const { result } = renderHook(() => useFetchDueWords());

    await expect(result.current.fetchDueWords()).rejects.toThrow();

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.loading).toBe(false);
    });
  });

  it("should handle 401 unauthorized errors", async () => {
    mock.onGet("/api/v1/progress/due").reply(401, { message: "Unauthorized" });

    const { result } = renderHook(() => useFetchDueWords());

    await expect(result.current.fetchDueWords()).rejects.toThrow();

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.loading).toBe(false);
    });
  });

  it("should accept optional date parameter", async () => {
    const targetDate = "2026-02-15";
    mock
      .onGet("/api/v1/progress/due", { params: { date: targetDate } })
      .reply(200, { ...mockDueWordsResponse, date: targetDate });

    const { result } = renderHook(() => useFetchDueWords());

    let responseData: DueWordsResponse | undefined;
    await waitFor(async () => {
      responseData = await result.current.fetchDueWords(targetDate);
    });

    expect(responseData?.date).toBe(targetDate);
  });

  it("should reset error state on subsequent calls", async () => {
    // First call fails
    mock.onGet("/api/v1/progress/due").networkErrorOnce();

    const { result } = renderHook(() => useFetchDueWords());

    await expect(result.current.fetchDueWords()).rejects.toThrow();
    await waitFor(() => expect(result.current.error).toBeTruthy());

    // Second call succeeds
    mock.onGet("/api/v1/progress/due").reply(200, mockDueWordsResponse);

    await result.current.fetchDueWords();
    await waitFor(() => expect(result.current.error).toBe(null));
  });

  it("should validate response format (missing words array)", async () => {
    mock.onGet("/api/v1/progress/due").reply(200, { date: "2026-02-14", count: 0 });

    const { result } = renderHook(() => useFetchDueWords());

    await expect(result.current.fetchDueWords()).rejects.toThrow(
      "Invalid response format from server",
    );
  });
});

// ============================================================================
// Tests: useSaveTestResult
// ============================================================================

describe("useSaveTestResult", () => {
  beforeEach(() => {
    mock.reset();
  });

  afterEach(() => {
    mock.reset();
  });

  it("should initialize with saving=false and error=null", () => {
    const { result } = renderHook(() => useSaveTestResult());

    expect(result.current.saving).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it("should save test result successfully", async () => {
    const requestPayload = {
      wordId: "hsk3-band1-042",
      correct: true,
      questionType: "multiple_choice" as const,
      timeSpentMs: 3500,
    };

    mock.onPost("/api/v1/progress/test-result", requestPayload).reply(200, mockTestResultResponse);

    const { result } = renderHook(() => useSaveTestResult());

    let responseData: TestResultResponse | undefined;
    await waitFor(async () => {
      responseData = await result.current.saveTestResult(requestPayload);
    });

    expect(responseData).toEqual(mockTestResultResponse);
    expect(result.current.saving).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it("should handle network errors", async () => {
    mock.onPost("/api/v1/progress/test-result").networkError();

    const { result } = renderHook(() => useSaveTestResult());

    await expect(
      result.current.saveTestResult({
        wordId: "test",
        correct: true,
        questionType: "multiple_choice",
      }),
    ).rejects.toThrow();

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.saving).toBe(false);
    });
  });

  it("should handle 400 bad request errors", async () => {
    mock.onPost("/api/v1/progress/test-result").reply(400, { message: "Invalid word ID" });

    const { result } = renderHook(() => useSaveTestResult());

    await expect(
      result.current.saveTestResult({
        wordId: "invalid",
        correct: true,
        questionType: "multiple_choice",
      }),
    ).rejects.toThrow();

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  });

  it("should validate response format (missing nextReviewDate)", async () => {
    mock.onPost("/api/v1/progress/test-result").reply(200, { lapseCount: 0 });

    const { result } = renderHook(() => useSaveTestResult());

    await expect(
      result.current.saveTestResult({
        wordId: "test",
        correct: true,
        questionType: "multiple_choice",
      }),
    ).rejects.toThrow("Invalid response format from server");
  });

  it("should handle missing optional fields in response", async () => {
    const minimalResponse = {
      nextReviewDate: "2026-03-16T08:00:00.000Z",
      lapseCount: 0,
      isLeech: false,
      xpEarned: 10,
    };

    mock.onPost("/api/v1/progress/test-result").reply(200, minimalResponse);

    const { result } = renderHook(() => useSaveTestResult());

    let responseData: TestResultResponse | undefined;
    await waitFor(async () => {
      responseData = await result.current.saveTestResult({
        wordId: "test",
        correct: true,
        questionType: "multiple_choice",
      });
    });

    expect(responseData?.nextReviewDate).toBe(minimalResponse.nextReviewDate);
    expect(responseData?.newBadges).toBeUndefined();
    expect(responseData?.freezeAwarded).toBeUndefined();
  });
});
