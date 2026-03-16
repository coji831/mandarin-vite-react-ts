/**
 * Tests for quiz reducer
 * Story 15.6: Quiz Container & State Management
 * Story 15.8: Added ERROR phase and RESET_QUIZ tests
 */

import { describe, it, expect } from "vitest";
import { quizReducer, initialState, QuizState, QuizAction } from "../quizReducer";
import { QuizQuestion, QuizAnswer } from "../../types";

describe("quizReducer", () => {
  it("initializes quiz with questions", () => {
    const questions: QuizQuestion[] = [
      {
        wordId: "1",
        word: "你好",
        pinyin: "nǐhǎo",
        english: "hello",
        mode: "multiple_choice",
        options: ["hello", "thank you", "goodbye", "yes"],
      },
    ];

    const action: QuizAction = {
      type: "QUIZ/INITIALIZE",
      questions,
      sessionId: "session1",
      expiresAt: "2026-03-15T00:00:00.000Z",
    };
    const newState = quizReducer(initialState, action);

    expect(newState.phase).toBe("QUESTION");
    expect(newState.questions).toEqual(questions);
    expect(newState.currentIndex).toBe(0);
    expect(newState.answers).toEqual([]);
    expect(newState.sessionId).toBe("session1");
  });

  it("resumes quiz with previous answers and current index", () => {
    const questions: QuizQuestion[] = [
      {
        wordId: "1",
        word: "你好",
        pinyin: "nǐhǎo",
        english: "hello",
        mode: "multiple_choice",
        options: ["hello", "thank you", "goodbye", "yes"],
      },
      {
        wordId: "2",
        word: "谢谢",
        pinyin: "xièxie",
        english: "thank you",
        mode: "type_pinyin",
      },
    ];

    const previousAnswers: QuizAnswer[] = [
      {
        wordId: "1",
        questionType: "multiple_choice",
        userAnswer: "hello",
        correct: true,
        timestamp: new Date("2026-03-08T10:00:00Z"),
        nextReviewDate: "2026-03-10T10:00:00Z",
        lapseCount: 0,
        isLeech: false,
      },
    ];

    const action: QuizAction = {
      type: "QUIZ/RESUME",
      questions,
      sessionId: "session1",
      currentIndex: 1,
      answers: previousAnswers,
      expiresAt: "2026-03-15T00:00:00.000Z",
    };
    const newState = quizReducer(initialState, action);

    expect(newState.phase).toBe("QUESTION");
    expect(newState.questions).toEqual(questions);
    expect(newState.currentIndex).toBe(1); // Resume from second question
    expect(newState.answers).toEqual(previousAnswers); // Restore previous answers
    expect(newState.sessionId).toBe("session1");
    expect(newState.error).toBeUndefined(); // No errors
  });

  it("submits answer and transitions to ANSWER_FEEDBACK", () => {
    const state: QuizState = {
      ...initialState,
      phase: "QUESTION",
      questions: [
        {
          wordId: "1",
          word: "你好",
          pinyin: "nǐhǎo",
          english: "hello",
          mode: "multiple_choice",
          options: ["hello", "thank you", "goodbye", "yes"],
        },
      ],
      currentIndex: 0,
      answers: [],
    };

    const answer: QuizAnswer = {
      wordId: "1",
      questionType: "multiple_choice",
      userAnswer: "hello",
      correct: true,
      timestamp: new Date(),
    };

    const action: QuizAction = { type: "QUIZ/SUBMIT_ANSWER", answer };
    const newState = quizReducer(state, action);

    expect(newState.phase).toBe("ANSWER_FEEDBACK");
    expect(newState.answers).toHaveLength(1);
    expect(newState.answers[0]).toEqual(answer);
  });

  it("advances to next question", () => {
    const state: QuizState = {
      ...initialState,
      phase: "ANSWER_FEEDBACK",
      questions: [
        {
          wordId: "1",
          word: "你好",
          pinyin: "nǐhǎo",
          english: "hello",
          mode: "multiple_choice",
          options: ["hello", "thank you", "goodbye", "yes"],
        },
        {
          wordId: "2",
          word: "谢谢",
          pinyin: "xièxie",
          english: "thank you",
          mode: "type_pinyin",
        },
      ],
      currentIndex: 0,
      answers: [
        {
          wordId: "1",
          questionType: "multiple_choice",
          userAnswer: "hello",
          correct: true,
          timestamp: new Date(),
        },
      ],
    };

    const action: QuizAction = { type: "QUIZ/NEXT_QUESTION" };
    const newState = quizReducer(state, action);

    expect(newState.phase).toBe("QUESTION");
    expect(newState.currentIndex).toBe(1);
  });

  it("completes quiz when no more questions", () => {
    const state: QuizState = {
      ...initialState,
      phase: "ANSWER_FEEDBACK",
      questions: [
        {
          wordId: "1",
          word: "你好",
          pinyin: "nǐhǎo",
          english: "hello",
          mode: "multiple_choice",
          options: ["hello", "thank you", "goodbye", "yes"],
        },
      ],
      currentIndex: 0,
      answers: [
        {
          wordId: "1",
          questionType: "multiple_choice",
          userAnswer: "hello",
          correct: true,
          timestamp: new Date(),
        },
      ],
    };

    const action: QuizAction = { type: "QUIZ/NEXT_QUESTION" };
    const newState = quizReducer(state, action);

    expect(newState.phase).toBe("LOADING"); // Hook then calls QUIZ/COMPLETE to transition to RESULTS
    expect(newState.currentIndex).toBe(1);
  });

  it("handles QUIZ/COMPLETE action", () => {
    const state: QuizState = {
      ...initialState,
      phase: "ANSWER_FEEDBACK",
      questions: [],
      currentIndex: 0,
      answers: [],
    };

    const action: QuizAction = { type: "QUIZ/COMPLETE" };
    const newState = quizReducer(state, action);

    expect(newState.phase).toBe("RESULTS");
  });

  it("returns unchanged state for unknown action", () => {
    const state: QuizState = {
      ...initialState,
      phase: "QUESTION",
      questions: [],
      currentIndex: 0,
      answers: [],
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const action = { type: "UNKNOWN_ACTION" } as any;
    const newState = quizReducer(state, action);

    expect(newState).toEqual(state);
  });

  // Story 15.8: Error handling tests
  describe("error handling", () => {
    it("sets error state with SET_ERROR action", () => {
      const state: QuizState = {
        ...initialState,
        phase: "LOADING",
        questions: [],
        currentIndex: 0,
        answers: [],
      };

      const action: QuizAction = { type: "QUIZ/SET_ERROR", error: "Failed to fetch words" };
      const newState = quizReducer(state, action);

      expect(newState.phase).toBe("ERROR");
      expect(newState.error).toBe("Failed to fetch words");
    });

    it("clears error on INITIALIZE_QUIZ", () => {
      const state: QuizState = {
        ...initialState,
        phase: "ERROR",
        questions: [],
        currentIndex: 0,
        answers: [],
        error: "Previous error",
      };

      const questions: QuizQuestion[] = [
        {
          wordId: "1",
          word: "你好",
          pinyin: "nǐhǎo",
          english: "hello",
          mode: "multiple_choice",
          options: ["hello", "thank you", "goodbye", "yes"],
        },
      ];

      const action: QuizAction = {
        type: "QUIZ/INITIALIZE",
        questions,
        sessionId: "session1",
        expiresAt: "2026-03-15T00:00:00.000Z",
      };
      const newState = quizReducer(state, action);

      expect(newState.phase).toBe("QUESTION");
      expect(newState.error).toBeUndefined();
    });

    it("resets quiz with RESET_QUIZ action", () => {
      const state: QuizState = {
        ...initialState,
        phase: "RESULTS",
        questions: [
          {
            wordId: "1",
            word: "你好",
            pinyin: "nǐhǎo",
            english: "hello",
            mode: "multiple_choice",
            options: ["hello", "thank you", "goodbye", "yes"],
          },
        ],
        currentIndex: 1,
        answers: [
          {
            wordId: "1",
            questionType: "multiple_choice",
            userAnswer: "hello",
            correct: true,
            timestamp: new Date(),
          },
        ],
      };

      const action: QuizAction = { type: "QUIZ/RESET" };
      const newState = quizReducer(state, action);

      expect(newState).toEqual(initialState);
    });

    it("preserves error state through other actions", () => {
      const state: QuizState = {
        ...initialState,
        phase: "ERROR",
        questions: [],
        currentIndex: 0,
        answers: [],
        error: "Network error",
      };

      const action: QuizAction = { type: "QUIZ/COMPLETE" };
      const newState = quizReducer(state, action);

      // Should update phase but preserve error
      expect(newState.phase).toBe("RESULTS");
      expect(newState.error).toBe("Network error");
    });
  });
});
