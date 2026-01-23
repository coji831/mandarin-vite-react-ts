/**
 * @file apps/frontend/src/features/mandarin/reducers/__tests__/progressReducer.test.ts
 * @description Unit tests for progressReducer (Story 13.4)
 */

import {
  progressReducer,
  progressInitialState,
  ProgressAction,
  selectWordsById,
} from "../progressReducer";
import { WordProgress, ProgressState } from "../../types";

describe("progressReducer", () => {
  describe("PROGRESS/LOAD_ALL", () => {
    it("should load all progress records", () => {
      const progressRecords: WordProgress[] = [
        {
          wordId: "word1",
          studyCount: 5,
          correctCount: 4,
          confidence: 0.8,
          nextReview: "2026-01-15",
        },
        {
          wordId: "word2",
          studyCount: 3,
          correctCount: 2,
          confidence: 0.6,
          nextReview: "2026-01-12",
        },
      ];

      const action: ProgressAction = {
        type: "PROGRESS/LOAD_ALL",
        payload: { progressRecords },
      };

      const newState = progressReducer(progressInitialState, action);

      expect(newState.wordsById).toEqual({
        word1: progressRecords[0],
        word2: progressRecords[1],
      });
      expect(newState.wordIds).toEqual(["word1", "word2"]);
    });

    it("should replace existing state when loading", () => {
      const initialState = {
        wordsById: {
          word1: { wordId: "word1", confidence: 0.3 },
        },
        wordIds: ["word1"],
      };

      const progressRecords: WordProgress[] = [{ wordId: "word2", confidence: 0.7 }];

      const action: ProgressAction = {
        type: "PROGRESS/LOAD_ALL",
        payload: { progressRecords },
      };

      const newState = progressReducer(initialState, action);

      expect(newState.wordsById).toEqual({
        word2: progressRecords[0],
      });
      expect(newState.wordIds).toEqual(["word2"]);
    });

    it("should handle empty progress records", () => {
      const action: ProgressAction = {
        type: "PROGRESS/LOAD_ALL",
        payload: { progressRecords: [] },
      };

      const newState = progressReducer(progressInitialState, action);

      expect(newState.wordsById).toEqual({});
      expect(newState.wordIds).toEqual([]);
    });
  });

  describe("PROGRESS/UPDATE_WORD", () => {
    it("should optimistically update existing word progress", () => {
      const initialState = {
        wordsById: {
          word1: { wordId: "word1", studyCount: 5, confidence: 0.5 },
        },
        wordIds: ["word1"],
      };

      const action: ProgressAction = {
        type: "PROGRESS/UPDATE_WORD",
        payload: {
          wordId: "word1",
          data: { studyCount: 6, confidence: 0.6 },
        },
      };

      const newState = progressReducer(initialState, action);

      expect(newState.wordsById.word1).toEqual({
        wordId: "word1",
        studyCount: 6,
        confidence: 0.6,
      });
      expect(newState.wordIds).toEqual(["word1"]);
    });

    it("should create new word progress if not exists", () => {
      const action: ProgressAction = {
        type: "PROGRESS/UPDATE_WORD",
        payload: {
          wordId: "word1",
          data: { studyCount: 1, confidence: 0.2 },
        },
      };

      const newState = progressReducer(progressInitialState, action);

      expect(newState.wordsById.word1).toEqual({
        wordId: "word1",
        studyCount: 1,
        confidence: 0.2,
      });
      expect(newState.wordIds).toEqual(["word1"]);
    });

    it("should not duplicate wordId in wordIds array", () => {
      const initialState = {
        wordsById: {
          word1: { wordId: "word1", confidence: 0.5 },
        },
        wordIds: ["word1"],
      };

      const action: ProgressAction = {
        type: "PROGRESS/UPDATE_WORD",
        payload: {
          wordId: "word1",
          data: { confidence: 0.7 },
        },
      };

      const newState = progressReducer(initialState, action);

      expect(newState.wordIds).toEqual(["word1"]);
      expect(newState.wordIds.length).toBe(1);
    });
  });

  describe("PROGRESS/SYNC_WORD", () => {
    it("should sync word with authoritative server data", () => {
      const initialState = {
        wordsById: {
          word1: { wordId: "word1", studyCount: 5, confidence: 0.5 },
        },
        wordIds: ["word1"],
      };

      const serverData: WordProgress = {
        wordId: "word1",
        studyCount: 6,
        correctCount: 5,
        confidence: 0.8,
        nextReview: "2026-01-15",
      };

      const action: ProgressAction = {
        type: "PROGRESS/SYNC_WORD",
        payload: {
          wordId: "word1",
          data: serverData,
        },
      };

      const newState = progressReducer(initialState, action);

      expect(newState.wordsById.word1).toEqual(serverData);
    });

    it("should add new word when syncing if not exists", () => {
      const serverData: WordProgress = {
        wordId: "word1",
        studyCount: 3,
        confidence: 0.6,
      };

      const action: ProgressAction = {
        type: "PROGRESS/SYNC_WORD",
        payload: {
          wordId: "word1",
          data: serverData,
        },
      };

      const newState = progressReducer(progressInitialState, action);

      expect(newState.wordsById.word1).toEqual(serverData);
      expect(newState.wordIds).toEqual(["word1"]);
    });

    it("should replace optimistic data with server truth", () => {
      const initialState = {
        wordsById: {
          word1: { wordId: "word1", studyCount: 999, confidence: 0.9 }, // Optimistic
        },
        wordIds: ["word1"],
      };

      const serverData: WordProgress = {
        wordId: "word1",
        studyCount: 5,
        correctCount: 4,
        confidence: 0.8,
        nextReview: "2026-01-20",
      };

      const action: ProgressAction = {
        type: "PROGRESS/SYNC_WORD",
        payload: {
          wordId: "word1",
          data: serverData,
        },
      };

      const newState = progressReducer(initialState, action);

      expect(newState.wordsById.word1).toEqual(serverData);
      expect(newState.wordsById.word1.studyCount).toBe(5); // Server value, not 999
    });
  });

  describe("Legacy actions", () => {
    it("should handle MARK_WORD_LEARNED", () => {
      const initialState = {
        wordsById: {
          word1: { wordId: "word1", learnedAt: null },
        },
        wordIds: ["word1"],
      };

      const action: ProgressAction = {
        type: "MARK_WORD_LEARNED",
        payload: { id: "word1", when: "2026-01-10T12:00:00Z" },
      };

      const newState = progressReducer(initialState, action);

      expect(newState.wordsById.word1.learnedAt).toBe("2026-01-10T12:00:00Z");
    });

    it("should handle RESET", () => {
      const stateWithData = {
        wordsById: { word1: { wordId: "word1", confidence: 0.5 } },
        wordIds: ["word1"],
      };

      const action: ProgressAction = { type: "RESET" };

      const newState = progressReducer(stateWithData, action);

      expect(newState).toEqual(progressInitialState);
    });

    it("should handle INIT", () => {
      const action: ProgressAction = { type: "INIT" };

      const newState = progressReducer(progressInitialState, action);

      expect(newState).toEqual(progressInitialState);
    });
  });

  describe("UNMARK_WORD_LEARNED (Story 13.4)", () => {
    it("should remove word from progress (toggle mastery)", () => {
      const initialState: ProgressState = {
        wordsById: {
          word1: { wordId: "word1", studyCount: 5, correctCount: 5, confidence: 1.0 },
          word2: { wordId: "word2", studyCount: 3, correctCount: 2, confidence: 0.7 },
        },
        wordIds: ["word1", "word2"],
      };

      const action: ProgressAction = {
        type: "UNMARK_WORD_LEARNED",
        payload: { wordId: "word1" },
      };

      const newState = progressReducer(initialState, action);

      expect(newState.wordsById.word1).toBeUndefined();
      expect(newState.wordsById.word2).toBeDefined();
      expect(newState.wordIds).toEqual(["word2"]);
    });

    it("should handle unmarking non-existent word gracefully", () => {
      const initialState: ProgressState = {
        wordsById: {
          word1: { wordId: "word1", confidence: 0.8 },
        },
        wordIds: ["word1"],
      };

      const action: ProgressAction = {
        type: "UNMARK_WORD_LEARNED",
        payload: { wordId: "word-nonexistent" },
      };

      const newState = progressReducer(initialState, action);

      expect(newState.wordsById).toEqual(initialState.wordsById);
      expect(newState.wordIds).toEqual(["word1"]);
    });

    it("should handle unmarking from empty state", () => {
      const action: ProgressAction = {
        type: "UNMARK_WORD_LEARNED",
        payload: { wordId: "word1" },
      };

      const newState = progressReducer(progressInitialState, action);

      expect(newState.wordsById).toEqual({});
      expect(newState.wordIds).toEqual([]);
    });
  });

  describe("selectWordsById selector (Story 13.4)", () => {
    it("should return wordsById from state", () => {
      const state: ProgressState = {
        wordsById: {
          word1: { wordId: "word1", confidence: 0.8 },
          word2: { wordId: "word2", confidence: 0.6 },
        },
        wordIds: ["word1", "word2"],
      };

      const result = selectWordsById(state);

      expect(result).toEqual(state.wordsById);
    });

    it("should return empty object when wordsById is undefined", () => {
      const state: ProgressState = {
        wordsById: undefined as any,
        wordIds: [],
      };

      const result = selectWordsById(state);

      expect(result).toEqual({});
    });

    it("should return empty object for initial state", () => {
      const result = selectWordsById(progressInitialState);

      expect(result).toEqual({});
    });
  });
});
