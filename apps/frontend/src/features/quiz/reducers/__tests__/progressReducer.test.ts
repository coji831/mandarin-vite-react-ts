/**
 * @file apps/frontend/src/features/quiz/reducers/__tests__/progressReducer.test.ts
 * @description Unit tests for progressReducer
 *
 * Moved from features/mandarin/reducers/__tests__/ (Phase 2 restructure)
 */

import {
  progressReducer,
  progressInitialState,
  ProgressAction,
  selectWordsById,
} from "../progressReducer";
import { WordProgress, ProgressState } from "../../types";

describe("progressReducer", () => {
  describe("QUIZ_PROGRESS_LOAD_ALL", () => {
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
        type: "QUIZ_PROGRESS_LOAD_ALL",
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
        type: "QUIZ_PROGRESS_LOAD_ALL",
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
        type: "QUIZ_PROGRESS_LOAD_ALL",
        payload: { progressRecords: [] },
      };

      const newState = progressReducer(progressInitialState, action);

      expect(newState.wordsById).toEqual({});
      expect(newState.wordIds).toEqual([]);
    });
  });

  describe("QUIZ_PROGRESS_UPDATE_WORD", () => {
    it("should optimistically update existing word progress", () => {
      const initialState = {
        wordsById: {
          word1: { wordId: "word1", studyCount: 5, confidence: 0.5 },
        },
        wordIds: ["word1"],
      };

      const action: ProgressAction = {
        type: "QUIZ_PROGRESS_UPDATE_WORD",
        payload: {
          wordId: "word1",
          data: { studyCount: 6, confidence: 0.6 },
        },
      };

      const newState = progressReducer(initialState, action);

      expect(newState.wordsById["word1"].studyCount).toBe(6);
      expect(newState.wordsById["word1"].confidence).toBe(0.6);
    });
  });

  describe("selectWordsById", () => {
    it("should return wordsById from state", () => {
      const state: ProgressState = {
        wordsById: { word1: { wordId: "word1" } },
        wordIds: ["word1"],
      };

      expect(selectWordsById(state)).toEqual(state.wordsById);
    });
  });
});
