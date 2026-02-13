/**
 * Tests for quiz reducer
 * Story 15.6: Quiz Container & State Management
 */

import { describe, it, expect } from "vitest";
import { quizReducer, initialState, QuizState, QuizAction } from "../quizReducer";
import { QuizQuestion, QuizAnswer } from "../../types/QuizTypes";

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

    const action: QuizAction = { type: "INITIALIZE_QUIZ", questions };
    const newState = quizReducer(initialState, action);

    expect(newState.phase).toBe("QUESTION");
    expect(newState.questions).toEqual(questions);
    expect(newState.currentIndex).toBe(0);
    expect(newState.answers).toEqual([]);
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
});
