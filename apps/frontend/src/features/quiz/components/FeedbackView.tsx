/**
 * FeedbackView.tsx
 * Phase 1 Gate Quiz — Feedback display
 *
 * Shows the result of the user's last answer: correct/incorrect badge,
 * answer comparison, description, and actions (Play Again + Next).
 *
 * For IME Simulator strategy, shows character-focused feedback instead.
 *
 * Wireframe Section 4.6 bottom portion.
 */

import { useQuizSessionStore } from "../stores/quizSessionStore";
import { AudioPlayer } from "./AudioPlayer";

/** Tone descriptions for feedback text */
const TONE_DESCS: Record<number, string> = {
  1: "high level",
  2: "rising",
  3: "low dipping",
  4: "falling",
  0: "neutral",
};

/** Strategies that use multiple-choice (selection-based) feedback */
const MULTIPLE_CHOICE_STRATEGIES = new Set(["radical-gate"]);

/** Shared card wrapper with correct/incorrect badge */
function FeedbackCard({ correct, children }: { correct: boolean; children: React.ReactNode }) {
  const cardClass = `quiz-feedback__card card-dark flex-col gap-md p-md radius-md ${correct ? "quiz-feedback__card--correct" : "quiz-feedback__card--incorrect"}`;
  return (
    <div className={cardClass}>
      <div
        className={`quiz-feedback__badge fw-700 flex-center font-md py-xs px-md radius-pill ${correct ? "quiz-feedback__badge--correct" : "quiz-feedback__badge--incorrect"}`}
      >
        <span>{correct ? "✅ Correct!" : "❌ Incorrect"}</span>
      </div>
      {children}
    </div>
  );
}

/** Feedback display with answer comparison */
export function FeedbackView() {
  const answers = useQuizSessionStore((s) => s.answers);
  const questions = useQuizSessionStore((s) => s.questions);
  const currentIndex = useQuizSessionStore((s) => s.currentIndex);
  const strategyType = useQuizSessionStore((s) => s.strategyType);
  const nextQuestion = useQuizSessionStore((s) => s.nextQuestion);

  const lastAnswer = answers.length > 0 ? answers[answers.length - 1] : null;
  const question = questions[currentIndex];

  if (!lastAnswer || !question) {
    return <div className="card-dark">No feedback available</div>;
  }

  // ── IME Simulator: character-focused feedback ──
  if (strategyType === "ime-simulator") {
    return (
      <FeedbackCard correct={lastAnswer.correct}>
        <p
          className="ime-quiz-feedback__char"
          style={{ fontSize: "var(--font-3xl)", fontWeight: 700, margin: 0 }}
        >
          {question.character}
        </p>
        <p
          className="ime-quiz-feedback__detail"
          style={{ fontSize: "var(--font-md)", color: "var(--text-secondary)", margin: 0 }}
        >
          {question.displayPinyin ?? question.correctPinyin}
          {question.meaning ? ` \u2014 ${question.meaning}` : ""}
        </p>
        <button className="btn-primary" onClick={nextQuestion}>
          Next Question \u2192
        </button>
      </FeedbackCard>
    );
  }

  // ── Multiple-choice feedback (radical gate) ──
  if (MULTIPLE_CHOICE_STRATEGIES.has(strategyType)) {
    return (
      <FeedbackCard correct={lastAnswer.correct}>
        <p className="text-secondary font-md" style={{ margin: 0 }}>
          {lastAnswer.feedback}
        </p>
        <button className="btn-primary quiz-feedback__next-btn" onClick={nextQuestion}>
          Next Question →
        </button>
      </FeedbackCard>
    );
  }

  // ── Standard pinyin+tone feedback ──
  return (
    <FeedbackCard correct={lastAnswer.correct}>
      {/* Answer comparison */}
      <div className="flex-center gap-lg flex-wrap">
        <div className="text-secondary" style={{ fontSize: "var(--font-md)" }}>
          Your answer: {lastAnswer.userPinyin} ({TONE_DESCS[lastAnswer.userTone] ?? "unknown"})
        </div>
        {!lastAnswer.correct && (
          <div
            style={{ fontSize: "var(--font-md)", color: "var(--color-success)", fontWeight: 600 }}
          >
            Correct: {lastAnswer.correctPinyin} ({TONE_DESCS[lastAnswer.correctTone] ?? "unknown"})
          </div>
        )}
      </div>

      {/* Description (when incorrect) */}
      {!lastAnswer.correct && (
        <p className="quiz-feedback__comparison text-tertiary font-md font-italic">
          ❌ Incorrect. The audio was &ldquo;{question.displayPinyin || question.correctPinyin}
          &rdquo; ({TONE_DESCS[lastAnswer.correctTone] ?? "unknown"}).
        </p>
      )}

      {/* Actions */}
      <div className="quiz-feedback__divider flex-center flex-between gap-md">
        <AudioPlayer
          audioKey={question.audioKey}
          character={question.character}
          label="Play Again"
        />
        <button className="btn-primary quiz-feedback__next-btn" onClick={nextQuestion}>
          Next Question &rarr;
        </button>
      </div>
    </FeedbackCard>
  );
}
