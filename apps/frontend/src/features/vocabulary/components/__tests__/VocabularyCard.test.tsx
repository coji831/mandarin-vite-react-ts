/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { VocabularyCard } from "../VocabularyCard";

// Mock useProgressState to return controllable progress data
const mockUseProgressState = vi.fn();
vi.mock("../../hooks", () => ({
  useProgressState: (selector: any) => selector(mockUseProgressState()),
}));

describe("VocabularyCard", () => {
  const createMockState = (progressData: Record<string, any> = {}) => ({
    progress: { wordsById: progressData, wordIds: Object.keys(progressData) },
    user: { userId: null, preferences: {} },
    ui: { selectedList: null, selectedWords: [], isLoading: false, error: "" },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows 'Not started' when progress is 0 and masteredCount is 0", () => {
    mockUseProgressState.mockReturnValue(createMockState({}));

    render(
      <VocabularyCard
        list={{
          id: "test-list",
          name: "Test List",
          wordCount: 10,
          description: "desc",
          difficulty: "beginner",
          tags: [],
          file: "test.csv",
        }}
        onSelect={() => {}}
      />,
    );

    // Component shows "Not started" when no progress (no percentage shown)
    expect(screen.getByText(/not started/i)).toBeInTheDocument();
  });

  it("shows correct mastered count and percent", () => {
    mockUseProgressState.mockReturnValue(
      createMockState({
        word1: { wordId: "word1", confidence: 1, lastReviewed: new Date().toISOString() },
        word2: { wordId: "word2", confidence: 1, lastReviewed: new Date().toISOString() },
        word3: { wordId: "word3", confidence: 1, lastReviewed: new Date().toISOString() },
        word4: { wordId: "word4", confidence: 1, lastReviewed: new Date().toISOString() },
        word5: { wordId: "word5", confidence: 1, lastReviewed: new Date().toISOString() },
      }),
    );

    render(
      <VocabularyCard
        list={{
          id: "test-list",
          name: "Test List",
          wordCount: 10,
          description: "desc",
          difficulty: "beginner",
          tags: [],
          file: "test.csv",
        }}
        wordIds={[
          "word1",
          "word2",
          "word3",
          "word4",
          "word5",
          "word6",
          "word7",
          "word8",
          "word9",
          "word10",
        ]}
        onSelect={() => {}}
      />,
    );

    // Component shows "5 / 10 mastered (50%)" format
    expect(screen.getByText(/5.*\/.*10.*mastered.*50%/i)).toBeInTheDocument();
  });

  it("shows 100% and all mastered when complete", () => {
    mockUseProgressState.mockReturnValue(
      createMockState({
        word1: { wordId: "word1", confidence: 1, lastReviewed: new Date().toISOString() },
        word2: { wordId: "word2", confidence: 1, lastReviewed: new Date().toISOString() },
        word3: { wordId: "word3", confidence: 1, lastReviewed: new Date().toISOString() },
        word4: { wordId: "word4", confidence: 1, lastReviewed: new Date().toISOString() },
        word5: { wordId: "word5", confidence: 1, lastReviewed: new Date().toISOString() },
        word6: { wordId: "word6", confidence: 1, lastReviewed: new Date().toISOString() },
        word7: { wordId: "word7", confidence: 1, lastReviewed: new Date().toISOString() },
        word8: { wordId: "word8", confidence: 1, lastReviewed: new Date().toISOString() },
        word9: { wordId: "word9", confidence: 1, lastReviewed: new Date().toISOString() },
        word10: { wordId: "word10", confidence: 1, lastReviewed: new Date().toISOString() },
      }),
    );

    render(
      <VocabularyCard
        list={{
          id: "test-list",
          name: "Test List",
          wordCount: 10,
          description: "desc",
          difficulty: "beginner",
          tags: [],
          file: "test.csv",
        }}
        wordIds={[
          "word1",
          "word2",
          "word3",
          "word4",
          "word5",
          "word6",
          "word7",
          "word8",
          "word9",
          "word10",
        ]}
        onSelect={() => {}}
      />,
    );

    // Component shows "10 / 10 mastered (100%)" format
    expect(screen.getByText(/10.*\/.*10.*mastered.*100%/i)).toBeInTheDocument();
  });
});
