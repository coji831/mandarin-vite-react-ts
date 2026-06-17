/**
 * Tests for quizSessionStore (Zustand)
 * Story 17.4: Migrate quizReducer to Zustand store
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useQuizSessionStore } from "../quizSessionStore";
import { QuizQuestion, QuizAnswer } from "../../types";

describe("quizSessionStore", () => {
  beforeEach(() => {
    useQuizSessionStore.setState(useQuizSessionStore.getInitialState());
  });

  it("initializes session with questions", () => {
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

    useQuizSessionStore
      .getState()
      .initializeSession(questions, "session1", "2026-03-15T00:00:00.000Z");
    const state = useQuizSessionStore.getState();

    expect(state.phase).toBe("QUESTION");
    expect(state.questions).toEqual(questions);
    expect(state.currentIndex).toBe(0);
    expect(state.answers).toEqual([]);
    expect(state.sessionId).toBe("session1");
    expect(state.error).toBeUndefined();
    expect(state.answerValue).toBe("");
    expect(state.showHint).toBe(false);
    expect(state.aiFeedback).toBeUndefined();
  });

  it("resumes session with previous answers and current index", () => {
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

    useQuizSessionStore
      .getState()
      .resumeSession(questions, "session1", 1, previousAnswers, "2026-03-15T00:00:00.000Z");
    const state = useQuizSessionStore.getState();

    expect(state.phase).toBe("QUESTION");
    expect(state.questions).toEqual(questions);
    expect(state.currentIndex).toBe(1);
    expect(state.answers).toEqual(previousAnswers);
    expect(state.sessionId).toBe("session1");
    expect(state.error).toBeUndefined();
    expect(state.answerValue).toBe("");
    expect(state.showHint).toBe(false);
  });

  it("submits answer and transitions to ANSWER_FEEDBACK", () => {
    useQuizSessionStore.getState().initializeSession(
      [
        {
          wordId: "1",
          word: "你好",
          pinyin: "nǐhǎo",
          english: "hello",
          mode: "multiple_choice",
          options: ["hello", "thank you", "goodbye", "yes"],
        },
      ],
      "session1",
      "2026-03-15T00:00:00.000Z",
    );

    const answer: QuizAnswer = {
      wordId: "1",
      questionType: "multiple_choice",
      userAnswer: "hello",
      correct: true,
      timestamp: new Date(),
    };

    useQuizSessionStore.getState().submitAnswer(answer);
    const state = useQuizSessionStore.getState();

    expect(state.phase).toBe("ANSWER_FEEDBACK");
    expect(state.answers).toHaveLength(1);
    expect(state.answers[0]).toEqual(answer);
  });

  it("advances to next question", () => {
    useQuizSessionStore.getState().initializeSession(
      [
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
      "session1",
      "2026-03-15T00:00:00.000Z",
    );

    useQuizSessionStore.getState().submitAnswer({
      wordId: "1",
      questionType: "multiple_choice",
      userAnswer: "hello",
      correct: true,
      timestamp: new Date(),
    });

    useQuizSessionStore.getState().nextQuestion();
    const state = useQuizSessionStore.getState();

    expect(state.phase).toBe("QUESTION");
    expect(state.currentIndex).toBe(1);
    expect(state.answerValue).toBe("");
    expect(state.showHint).toBe(false);
    expect(state.aiFeedback).toBeUndefined();
  });

  it("transitions to LOADING when advancing past last question", () => {
    useQuizSessionStore.getState().initializeSession(
      [
        {
          wordId: "1",
          word: "你好",
          pinyin: "nǐhǎo",
          english: "hello",
          mode: "multiple_choice",
          options: ["hello", "thank you", "goodbye", "yes"],
        },
      ],
      "session1",
      "2026-03-15T00:00:00.000Z",
    );

    useQuizSessionStore.getState().submitAnswer({
      wordId: "1",
      questionType: "multiple_choice",
      userAnswer: "hello",
      correct: true,
      timestamp: new Date(),
    });

    useQuizSessionStore.getState().nextQuestion();
    const state = useQuizSessionStore.getState();

    expect(state.phase).toBe("LOADING");
    expect(state.currentIndex).toBe(1);
  });

  it("completes session and transitions to RESULTS", () => {
    useQuizSessionStore.getState().completeSession();
    const state = useQuizSessionStore.getState();

    expect(state.phase).toBe("RESULTS");
    expect(state.isFreshCompletion).toBe(true);
  });

  it("handles setError action", () => {
    useQuizSessionStore.getState().setError("Failed to fetch words");
    const state = useQuizSessionStore.getState();

    expect(state.phase).toBe("ERROR");
    expect(state.error).toBe("Failed to fetch words");
  });

  it("resets session to pristine state", () => {
    useQuizSessionStore.getState().initializeSession(
      [
        {
          wordId: "1",
          word: "你好",
          pinyin: "nǐhǎo",
          english: "hello",
          mode: "multiple_choice",
          options: ["hello", "thank you", "goodbye", "yes"],
        },
      ],
      "session1",
      "2026-03-15T00:00:00.000Z",
    );

    useQuizSessionStore.getState().resetSession();
    const state = useQuizSessionStore.getState();

    expect(state.phase).toBe("LOADING");
    expect(state.questions).toEqual([]);
    expect(state.currentIndex).toBe(0);
    expect(state.answers).toEqual([]);
    expect(state.sessionId).toBeUndefined();
    expect(state.error).toBeUndefined();
    expect(state.answerValue).toBe("");
    expect(state.showHint).toBe(false);
    expect(state.aiFeedback).toBeUndefined();
    expect(state.expiresAt).toBeUndefined();
    expect(state.isFreshCompletion).toBe(false);
  });

  it("sets answer value", () => {
    useQuizSessionStore.getState().setAnswerValue("nǐhǎo");
    const state = useQuizSessionStore.getState();

    expect(state.answerValue).toBe("nǐhǎo");
  });

  it("toggles hint visibility", () => {
    useQuizSessionStore.getState().toggleHint(true);
    expect(useQuizSessionStore.getState().showHint).toBe(true);

    useQuizSessionStore.getState().toggleHint(false);
    expect(useQuizSessionStore.getState().showHint).toBe(false);
  });

  it("sets AI feedback", () => {
    useQuizSessionStore.getState().setAiFeedback("Good try! The correct answer was 你好.");
    expect(useQuizSessionStore.getState().aiFeedback).toBe(
      "Good try! The correct answer was 你好.",
    );

    useQuizSessionStore.getState().setAiFeedback(undefined);
    expect(useQuizSessionStore.getState().aiFeedback).toBeUndefined();
  });

  it("shows daily complete results", () => {
    useQuizSessionStore.getState().showDailyCompleteResults("session1", "2026-03-15T00:00:00.000Z");
    const state = useQuizSessionStore.getState();

    expect(state.phase).toBe("RESULTS");
    expect(state.sessionId).toBe("session1");
    expect(state.expiresAt).toBe("2026-03-15T00:00:00.000Z");
    expect(state.currentIndex).toBe(0);
    expect(state.questions).toEqual([]);
    expect(state.answers).toEqual([]);
    expect(state.isFreshCompletion).toBe(false);
  });
});
