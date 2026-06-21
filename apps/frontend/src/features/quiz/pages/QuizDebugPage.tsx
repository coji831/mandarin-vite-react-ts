/**
 * QuizDebugPage.tsx
 * Development-only — Inspect quiz UI in different states via ?state= param.
 * States: question, correct, wrong, finished
 *
 * Accessed at: /practices/quiz?type=_debug&state=<state>
 */

import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuizSessionStore } from "../stores/quizSessionStore";
import { QuizRouter } from "../components/QuizRouter";
import { Timer } from "../components/Timer";
import { QuizProgressBar } from "../components/QuizProgressBar";
import type { QuizQuestion, AnswerResult } from "../types";
import "../components/Quiz.css";

const MOCK_QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    audioKey: "bā",
    correctPinyin: "ba",
    correctTone: 1,
    category: "pinyin",
    displayPinyin: "bā",
  },
  {
    id: "q2",
    audioKey: "pó",
    correctPinyin: "po",
    correctTone: 2,
    category: "tones",
    displayPinyin: "pó",
  },
  {
    id: "q3",
    audioKey: "mǎ",
    correctPinyin: "ma",
    correctTone: 3,
    category: "pairs",
    displayPinyin: "mǎ",
  },
  {
    id: "q4",
    audioKey: "dà",
    correctPinyin: "da",
    correctTone: 4,
    category: "rules",
    displayPinyin: "dà",
  },
  {
    id: "q5",
    audioKey: "tā",
    correctPinyin: "ta",
    correctTone: 1,
    category: "pinyin",
    displayPinyin: "tā",
  },
];

const TONE_DESCS: Record<number, string> = {
  1: "high level",
  2: "rising",
  3: "low dipping",
  4: "falling",
  0: "neutral",
};

function makeCorrectAnswer(question: QuizQuestion): AnswerResult {
  return {
    correct: true,
    userPinyin: question.correctPinyin,
    userTone: question.correctTone,
    correctPinyin: question.correctPinyin,
    correctTone: question.correctTone,
    feedback: "Correct!",
    toneDescription: TONE_DESCS[question.correctTone],
  };
}

function makeWrongAnswer(question: QuizQuestion): AnswerResult {
  const wrongTone = question.correctTone === 1 ? 3 : 1;
  return {
    correct: false,
    userPinyin: question.correctPinyin,
    userTone: wrongTone,
    correctPinyin: question.correctPinyin,
    correctTone: question.correctTone,
    feedback: `Incorrect. The audio was "${question.displayPinyin}" (${TONE_DESCS[question.correctTone]}).`,
    toneDescription: TONE_DESCS[question.correctTone],
  };
}

export function QuizDebugPage() {
  const [searchParams] = useSearchParams();
  const state = searchParams.get("state") || "question";

  const reset = useQuizSessionStore((s) => s.reset);
  const phase = useQuizSessionStore((s) => s.phase);
  const score = useQuizSessionStore((s) => s.score);
  const totalQuestions = useQuizSessionStore((s) => s.questions.length);
  const currentIndex = useQuizSessionStore((s) => s.currentIndex);

  useEffect(() => {
    reset();

    // Set common baseline state
    const common = {
      strategyType: "audio-to-type" as const,
      questions: MOCK_QUESTIONS,
      timer: 150,
    };

    switch (state) {
      case "question":
      case "input":
        useQuizSessionStore.setState({
          ...common,
          phase: "INPUT" as const,
          currentIndex: 1,
          answers: [makeCorrectAnswer(MOCK_QUESTIONS[0])],
          score: 1,
        });
        break;

      case "correct":
        useQuizSessionStore.setState({
          ...common,
          phase: "FEEDBACK" as const,
          currentIndex: 2,
          answers: [
            makeCorrectAnswer(MOCK_QUESTIONS[0]),
            makeCorrectAnswer(MOCK_QUESTIONS[1]),
            makeCorrectAnswer(MOCK_QUESTIONS[2]),
          ],
          score: 3,
        });
        break;

      case "wrong":
        useQuizSessionStore.setState({
          ...common,
          phase: "FEEDBACK" as const,
          currentIndex: 2,
          answers: [
            makeCorrectAnswer(MOCK_QUESTIONS[0]),
            makeCorrectAnswer(MOCK_QUESTIONS[1]),
            makeWrongAnswer(MOCK_QUESTIONS[2]),
          ],
          score: 2,
        });
        break;

      case "finished":
        useQuizSessionStore.setState({
          ...common,
          phase: "RESULTS" as const,
          currentIndex: 4,
          answers: [
            makeCorrectAnswer(MOCK_QUESTIONS[0]),
            makeCorrectAnswer(MOCK_QUESTIONS[1]),
            makeWrongAnswer(MOCK_QUESTIONS[2]),
            makeCorrectAnswer(MOCK_QUESTIONS[3]),
            makeWrongAnswer(MOCK_QUESTIONS[4]),
          ],
          score: 3,
        });
        break;

      default:
        useQuizSessionStore.setState({
          ...common,
          phase: "INPUT" as const,
          currentIndex: 0,
          answers: [],
          score: 0,
        });
    }
  }, [state, reset]);

  return (
    <div className="flex-col gap-lg p-xl mx-auto" style={{ maxWidth: 700 }}>
      {/* Debug controls */}
      <div className="card-dark flex-col gap-sm">
        <div
          className="text-muted"
          style={{
            fontSize: "var(--font-xs)",
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          🐛 Debug: {state}
        </div>
        <div className="flex-center gap-sm flex-wrap">
          {["question", "correct", "wrong", "finished"].map((s) => (
            <a
              key={s}
              href={`?type=_debug&state=${s}`}
              className="btn-primary"
              style={{
                fontSize: "var(--font-xs)",
                padding: "0.25rem 0.75rem",
                textDecoration: "none",
                opacity: s === state ? 1 : 0.6,
              }}
            >
              {s}
            </a>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="card-dark flex-between gap-md">
        <span
          className="fw-700 text-primary quiz-results__heading"
          style={{ fontSize: "var(--font-lg)" }}
        >
          📝 Phase 1 Quiz &mdash; Audio-to-Type
        </span>
        <Timer />
      </div>

      {/* Question counter */}
      {(phase === "QUESTION" || phase === "INPUT" || phase === "FEEDBACK") && (
        <div className="flex-center flex-between">
          <span className="text-secondary fw-600" style={{ fontSize: "var(--font-md)" }}>
            Question {currentIndex + 1} of {totalQuestions}
          </span>
        </div>
      )}

      {/* Quiz content */}
      <QuizRouter />

      {/* Progress bar */}
      {(phase === "QUESTION" || phase === "INPUT" || phase === "FEEDBACK") && (
        <QuizProgressBar current={score} total={totalQuestions} />
      )}
    </div>
  );
}
