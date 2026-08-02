/**
 * @file components/tones/SandhiDrill.tsx
 * @description Tone sandhi practice drill widget — teaches sandhi rules via
 *              interactive multiple-choice quiz. Embedded in TonesTab.
 * Story 21.17: Tone Sandhi Practice Quiz
 *
 * States:
 * 1. Rules intro — 2×2 grid of rule explanation cards with "Start Drill" CTA
 * 2. Drill active — progress bar, character display, 4 pinyin options, feedback
 * 3. Results — score card, rule-by-rule breakdown, pass/fail badge
 * 4. Loading — skeleton while fetching questions
 * 5. Error — error screen with retry
 */

import { useCallback, useState, useRef, useEffect } from "react";
import { Box, Button, ErrorScreen, LoadingScreen, ProgressBar } from "shared/components";
import type { DrillQuestion } from "../../services/sandhiDrillService";
import {
  getSandhiDrillQuestions,
  calculateScore,
  submitSandhiDrillAttempt,
} from "../../services/sandhiDrillService";
import "./SandhiDrill.css";

// ─── Constants ──────────────────────────────────────────────────────────

const PASS_THRESHOLD = 70;
const QUESTION_COUNT = 10;

type DrillPhase = "rules" | "active" | "results" | "loading" | "error";

interface RuleCard {
  ruleId: string;
  name: string;
  formula: string;
  description: string;
  examples: { characters: string; dictionary: string; sandhi: string }[];
}

const RULE_CARDS: RuleCard[] = [
  {
    ruleId: "3-3-sandhi",
    name: "Third Tone Sandhi",
    formula: "3-3 → 2-3",
    description:
      "When two 3rd-tone syllables appear consecutively, the first syllable is pronounced as 2nd tone.",
    examples: [
      { characters: "你好", dictionary: "nǐ hǎo", sandhi: "ní hǎo" },
      { characters: "很好", dictionary: "hěn hǎo", sandhi: "hén hǎo" },
    ],
  },
  {
    ruleId: "bu-before-4th",
    name: "不 (bù) Before 4th Tone",
    formula: "bù + 4th → bú + 4th",
    description:
      "The negative marker 不 (bù) changes from 4th tone to 2nd tone when followed by a 4th-tone syllable.",
    examples: [
      { characters: "不是", dictionary: "bù shì", sandhi: "bú shì" },
      { characters: "不会", dictionary: "bù huì", sandhi: "bú huì" },
    ],
  },
  {
    ruleId: "yi-before-4th",
    name: "一 (yī) Before 4th Tone",
    formula: "yī + 4th → yí + 4th",
    description:
      "The number 一 (yī) changes from 1st tone to 2nd tone when followed by a 4th-tone syllable.",
    examples: [
      { characters: "一个", dictionary: "yī gè", sandhi: "yí gè" },
      { characters: "一次", dictionary: "yī cì", sandhi: "yí cì" },
    ],
  },
  {
    ruleId: "yi-before-non4th",
    name: "一 (yī) Before Non-4th Tone",
    formula: "yī + (1st/2nd/3rd) → yì + (1st/2nd/3rd)",
    description:
      "The number 一 (yī) changes from 1st tone to 4th tone when followed by a 1st, 2nd, or 3rd-tone syllable.",
    examples: [
      { characters: "一般", dictionary: "yī bān", sandhi: "yì bān" },
      { characters: "一年", dictionary: "yī nián", sandhi: "yì nián" },
    ],
  },
];

function getRuleLabel(ruleId: string): string {
  const card = RULE_CARDS.find((r) => r.ruleId === ruleId);
  return card?.name ?? ruleId;
}

// ─── Sub-Components ────────────────────────────────────────────────────

function RuleCardsIntro({ onStart }: { onStart: () => void }) {
  return (
    <div className="sandhi-drill flex-col gap-lg">
      <Box variant="dark" padding="md" className="sandhi-drill-header">
        <h3 className="font-lg fw-700 text-secondary m-0">Tone Sandhi Drill</h3>
        <p className="font-sm text-tertiary m-0 mt-xs">
          Learn how tones change in context, then test yourself with a {QUESTION_COUNT}-question
          quiz. A score of {PASS_THRESHOLD}% or higher passes.
        </p>
      </Box>

      <div className="sandhi-drill-rules-grid">
        {RULE_CARDS.map((rule) => (
          <Box key={rule.ruleId} variant="card" padding="sm" className="sandhi-drill-rule-card">
            <h4 className="font-sm fw-700 text-secondary m-0">{rule.name}</h4>
            <p className="sandhi-drill-rule-formula text-primary fw-600 font-xs m-0 mt-xs op-80">
              {rule.formula}
            </p>
            <p className="font-xs text-tertiary m-0 mt-xs lh-normal">{rule.description}</p>
            <div className="sandhi-drill-rule-examples text-tertiary mt-sm flex-col gap-4px">
              {rule.examples.map((ex, i) => (
                <span key={i} className="font-xs">
                  {ex.characters} →{" "}
                  <span className="fw-600" style={{ color: "var(--color-primary)" }}>
                    {ex.sandhi}
                  </span>{" "}
                  <span className="op-60">({ex.dictionary})</span>
                </span>
              ))}
            </div>
          </Box>
        ))}
      </div>

      <div className="flex-center">
        <Button variant="primary" size="lg" onClick={onStart}>
          Start Drill
        </Button>
      </div>
    </div>
  );
}

function DrillActive({
  questions,
  currentIndex,
  selectedAnswer,
  showFeedback,
  onSelectAnswer,
}: {
  questions: DrillQuestion[];
  currentIndex: number;
  selectedAnswer: string | null;
  showFeedback: boolean;
  onSelectAnswer: (answer: string) => void;
}) {
  const question = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const isCorrect = selectedAnswer === question.correctAnswer;

  return (
    <div className="sandhi-drill flex-col gap-md">
      {/* Progress */}
      <div className="flex-col gap-4px">
        <ProgressBar value={progress} threshold={PASS_THRESHOLD} />
        <span className="sandhi-drill-progress-text text-muted">
          Question {currentIndex + 1} of {questions.length}
        </span>
      </div>

      {/* Character Display */}
      <Box variant="dark" padding="lg" className="sandhi-drill-active">
        <div className="sandhi-drill-character text-secondary fw-700">{question.characters}</div>
        <p className="font-xs text-tertiary m-0 mt-xs">Dictionary: {question.dictionaryPinyin}</p>
        <p className="font-xs text-muted m-0 mt-4px">Which spoken (sandhi) pinyin is correct?</p>
      </Box>

      {/* Option Buttons */}
      <div className="sandhi-drill-options">
        {question.options.map((option) => {
          let className = "sandhi-drill-option-btn";
          if (showFeedback) {
            if (option === question.correctAnswer) {
              className += " sandhi-drill-option-btn--correct";
            } else if (option === selectedAnswer && option !== question.correctAnswer) {
              className += " sandhi-drill-option-btn--wrong";
            } else {
              className += " sandhi-drill-option-btn--dimmed op-40";
            }
          }
          return (
            <Button
              key={option}
              variant="secondary"
              className={className}
              onClick={() => onSelectAnswer(option)}
              disabled={showFeedback}
            >
              {option}
            </Button>
          );
        })}
      </div>

      {/* Feedback */}
      {showFeedback && (
        <div
          className={`sandhi-drill-feedback font-sm fw-600 ${
            isCorrect ? "sandhi-drill-feedback--correct" : "sandhi-drill-feedback--wrong"
          }`}
          role="alert"
        >
          {isCorrect ? "✓ Correct!" : `✗ The sandhi form is: ${question.correctAnswer}`}
        </div>
      )}
    </div>
  );
}

function DrillResults({
  answers,
  questions,
  onReviewRules,
  onTryAgain,
}: {
  answers: { questionId: string; selected: string; correctAnswer: string; ruleId: string }[];
  questions: DrillQuestion[];
  onReviewRules: () => void;
  onTryAgain: () => void;
}) {
  const result = calculateScore(answers);
  const percentage = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;
  const passed = percentage >= PASS_THRESHOLD;

  const ruleEntries = Object.entries(result.ruleScores);

  return (
    <div className="sandhi-drill flex-col gap-lg">
      {/* Score Card */}
      <Box variant={passed ? "pass" : "fail"} padding="lg" className="sandhi-drill-results">
        <h3 className="font-lg fw-700 m-0">Drill Complete!</h3>
        <div className="sandhi-drill-results-score mt-sm">
          {result.score}/{result.total}
        </div>
        <p className="font-md text-secondary m-0">{percentage}%</p>
        <span
          className={`sandhi-drill-results-badge mt-sm ${
            passed ? "sandhi-drill-results-badge--pass" : "sandhi-drill-results-badge--fail"
          }`}
        >
          {passed ? "✓ Passed" : "✗ Needs Review"}
        </span>
        {!passed && (
          <p className="font-xs text-tertiary m-0 mt-sm">
            {PASS_THRESHOLD}% required to pass. Review the rules and try again.
          </p>
        )}
      </Box>

      {/* Rule-by-Rule Breakdown */}
      {ruleEntries.length > 0 && (
        <Box variant="dark-alt" padding="md">
          <h4 className="font-sm fw-600 text-secondary m-0 mb-xs">Rule Breakdown</h4>
          <table className="sandhi-drill-results-table">
            <thead>
              <tr>
                <th className="op-80">Rule</th>
                <th className="op-80">Score</th>
                <th className="op-80">%</th>
              </tr>
            </thead>
            <tbody>
              {ruleEntries.map(([ruleId, score]) => (
                <tr key={ruleId}>
                  <td className="text-secondary">{getRuleLabel(ruleId)}</td>
                  <td className="text-secondary">
                    {score.correct}/{score.total}
                  </td>
                  <td
                    className={
                      score.total > 0
                        ? (score.correct / score.total) * 100 >= 70
                          ? "text-success"
                          : "text-error"
                        : "text-muted"
                    }
                  >
                    {score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      )}

      {/* Actions */}
      <div className="sandhi-drill-results-actions">
        <Button variant="secondary" onClick={onReviewRules}>
          Review Rules
        </Button>
        <Button variant="primary" onClick={onTryAgain}>
          Try Again
        </Button>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────

export function SandhiDrill() {
  const [phase, setPhase] = useState<DrillPhase>("rules");
  const [questions, setQuestions] = useState<DrillQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<
    { questionId: string; selected: string; correctAnswer: string; ruleId: string }[]
  >([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const fetchQuestions = useCallback(async () => {
    setPhase("loading");
    setError(null);
    try {
      const data = await getSandhiDrillQuestions(QUESTION_COUNT);
      setQuestions(data);
      setCurrentIndex(0);
      setAnswers([]);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setPhase("active");
    } catch {
      setError("Failed to load sandhi drill questions. Please try again.");
      setPhase("error");
    }
  }, []);

  const handleStart = useCallback(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleSelectAnswer = useCallback(
    (answer: string) => {
      if (showFeedback) return;
      setSelectedAnswer(answer);
      setShowFeedback(true);

      const question = questions[currentIndex];
      const newAnswers = [
        ...answers,
        {
          questionId: question.id,
          selected: answer,
          correctAnswer: question.correctAnswer,
          ruleId: question.ruleId,
        },
      ];
      setAnswers(newAnswers);

      // Auto-advance after a short delay
      timeoutRef.current = setTimeout(() => {
        if (currentIndex < questions.length - 1) {
          setCurrentIndex((prev) => prev + 1);
          setSelectedAnswer(null);
          setShowFeedback(false);
        } else {
          // Quiz complete — submit results
          const result = calculateScore(newAnswers);
          submitSandhiDrillAttempt(result.score, result.total, result.ruleScores).catch(() => {
            // Non-critical: results display locally even if submission fails
          });
          setPhase("results");
        }
      }, 1200);
    },
    [showFeedback, questions, currentIndex, answers],
  );

  const handleReviewRules = useCallback(() => {
    setPhase("rules");
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers([]);
    setSelectedAnswer(null);
    setShowFeedback(false);
  }, []);

  const handleTryAgain = useCallback(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Render based on phase
  switch (phase) {
    case "loading":
      return (
        <div className="sandhi-drill-loading">
          <LoadingScreen message="Loading sandhi drill questions..." />
        </div>
      );

    case "error":
      return (
        <ErrorScreen
          error={error ?? "An unexpected error occurred."}
          onRetry={handleTryAgain}
          title="Failed to Load Drill"
        />
      );

    case "rules":
      return <RuleCardsIntro onStart={handleStart} />;

    case "active":
      if (!questions || questions.length === 0) {
        return (
          <div className="sandhi-drill-loading">
            <LoadingScreen message="Preparing drill questions..." />
          </div>
        );
      }
      return (
        <DrillActive
          questions={questions}
          currentIndex={currentIndex}
          selectedAnswer={selectedAnswer}
          showFeedback={showFeedback}
          onSelectAnswer={handleSelectAnswer}
        />
      );

    case "results":
      return (
        <DrillResults
          answers={answers}
          questions={questions}
          onReviewRules={handleReviewRules}
          onTryAgain={handleTryAgain}
        />
      );

    default:
      return null;
  }
}
