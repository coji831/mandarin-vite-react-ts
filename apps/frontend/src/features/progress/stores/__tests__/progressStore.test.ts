import { describe, it, expect, vi, beforeEach } from "vitest";
import { useProgressStore } from "../progressStore";

// Mock the progressService
vi.mock("../../services/progressService", () => ({
  progressApi: {
    getAllProgress: vi.fn(),
  },
}));

describe("useProgressStore", () => {
  beforeEach(() => {
    useProgressStore.setState({
      wordsById: {},
      wordIds: [],
      isLoading: false,
      error: undefined,
    });
  });

  it("should initialize with empty state", () => {
    const state = useProgressStore.getState();
    expect(state.wordsById).toEqual({});
    expect(state.wordIds).toEqual([]);
    expect(state.isLoading).toBe(false);
  });

  it("should update word progress optimistically", () => {
    const { updateWordProgress } = useProgressStore.getState();
    updateWordProgress("word-1", { studyCount: 1, correctCount: 1 });
    const state = useProgressStore.getState();
    expect(state.wordsById["word-1"]).toBeDefined();
    expect(state.wordsById["word-1"].studyCount).toBe(1);
  });

  it("should batch update multiple words", () => {
    const { batchUpdate } = useProgressStore.getState();
    batchUpdate([
      { wordId: "w1", data: { studyCount: 1 } },
      { wordId: "w2", data: { studyCount: 2 } },
    ]);
    const state = useProgressStore.getState();
    expect(state.wordIds).toContain("w1");
    expect(state.wordIds).toContain("w2");
    expect(state.wordsById["w1"].studyCount).toBe(1);
    expect(state.wordsById["w2"].studyCount).toBe(2);
  });

  it("should reset to initial state", () => {
    useProgressStore.getState().updateWordProgress("w1", { studyCount: 1 });
    useProgressStore.getState().reset();
    const state = useProgressStore.getState();
    expect(state.wordsById).toEqual({});
    expect(state.wordIds).toEqual([]);
  });
});
