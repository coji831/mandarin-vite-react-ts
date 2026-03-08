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

    const action: QuizAction = { type: "INITIALIZE_QUIZ", questions, sessionId: "session1" };
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
        nextReview: "2026-03-10T10:00:00Z",
        lapseCount: 0,
        isLeech: false,
      },
    ];

    const action: QuizAction = {
      type: "RESUME_QUIZ",
      questions,
      sessionId: "session1",
      currentIndex: 1,
      answers: previousAnswers,
    };
    const newState = quizReducer(initialState, action);

    expect(newState.phase).toBe("QUESTION");
    expect(newState.questions).toEqual(questions);
    expect(newState.currentIndex).toBe(1); // Resume from second question
    expect(newState.answers).toEqual(previousAnswers); // Restore previous answers
    expect(newState.sessionId).toBe("session1");
    expect(newState.totalXP).toBe(0); // Gamification not yet awarded
    expect(newState.error).toBeUndefined(); // No errors
  });

  it("submits answer and transitions to ANSWER_FEEDBACK", () => {
    const state: QuizState = {
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

    const action: QuizAction = { type: "SUBMIT_ANSWER", answer };
    const newState = quizReducer(state, action);

    expect(newState.phase).toBe("ANSWER_FEEDBACK");
    expect(newState.answers).toHaveLength(1);
    expect(newState.answers[0]).toEqual(answer);
  });

  it("updates answer metadata with backend response", () => {
    const state: QuizState = {
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
          word: "你好",
          pinyin: "nǐhǎo",
          english: "hello",
          questionType: "multiple_choice",
          userAnswer: "hello",
          correct: true,
          timestamp: new Date(),
        },
      ],
    };

    const action: QuizAction = {
      type: "UPDATE_ANSWER_METADATA",
      wordId: "1",
      nextReview: "2026-02-21T10:00:00Z",
      lapseCount: 0,
    };
    const newState = quizReducer(state, action);

    expect(newState.answers[0].nextReview).toBe("2026-02-21T10:00:00Z");
    expect(newState.answers[0].lapseCount).toBe(0);
    expect(newState.answers[0].word).toBe("你好");
    expect(newState.answers[0].pinyin).toBe("nǐhǎo");
  });

  it("advances to next question", () => {
    const state: QuizState = {
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

    const action: QuizAction = { type: "NEXT_QUESTION" };
    const newState = quizReducer(state, action);

    expect(newState.phase).toBe("QUESTION");
    expect(newState.currentIndex).toBe(1);
  });

  it("completes quiz when no more questions", () => {
    const state: QuizState = {
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

    const action: QuizAction = { type: "NEXT_QUESTION" };
    const newState = quizReducer(state, action);

    expect(newState.phase).toBe("COMPLETE");
    expect(newState.currentIndex).toBe(1);
  });

  it("handles COMPLETE_QUIZ action", () => {
    const state: QuizState = {
      phase: "ANSWER_FEEDBACK",
      questions: [],
      currentIndex: 0,
      answers: [],
    };

    const action: QuizAction = { type: "COMPLETE_QUIZ" };
    const newState = quizReducer(state, action);

    expect(newState.phase).toBe("COMPLETE");
  });

  it("returns unchanged state for unknown action", () => {
    const state: QuizState = {
      phase: "QUESTION",
      questions: [],
      currentIndex: 0,
      answers: [],
    };

    const action = { type: "UNKNOWN_ACTION" } as any;
    const newState = quizReducer(state, action);

    expect(newState).toEqual(state);
  });

  // Story 15.8: Error handling tests
  describe("error handling", () => {
    it("sets error state with SET_ERROR action", () => {
      const state: QuizState = {
        phase: "LOADING",
        questions: [],
        currentIndex: 0,
        answers: [],
      };

      const action: QuizAction = { type: "SET_ERROR", error: "Failed to fetch words" };
      const newState = quizReducer(state, action);

      expect(newState.phase).toBe("ERROR");
      expect(newState.error).toBe("Failed to fetch words");
    });

    it("clears error on INITIALIZE_QUIZ", () => {
      const state: QuizState = {
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

      const action: QuizAction = { type: "INITIALIZE_QUIZ", questions };
      const newState = quizReducer(state, action);

      expect(newState.phase).toBe("QUESTION");
      expect(newState.error).toBeUndefined();
    });

    it("resets quiz with RESET_QUIZ action", () => {
      const state: QuizState = {
        phase: "COMPLETE",
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

      const action: QuizAction = { type: "RESET_QUIZ" };
      const newState = quizReducer(state, action);

      expect(newState).toEqual(initialState);
    });

    it("preserves error state through other actions", () => {
      const state: QuizState = {
        phase: "ERROR",
        questions: [],
        currentIndex: 0,
        answers: [],
        error: "Network error",
      };

      const action: QuizAction = { type: "COMPLETE_QUIZ" };
      const newState = quizReducer(state, action);

      // Should update phase but preserve error
      expect(newState.phase).toBe("COMPLETE");
      expect(newState.error).toBe("Network error");
    });
  });
});
