/**
 * QuizCard
 *
 * Presentational quiz card for the Practices index page: the phase label, one
 * labelled CTA PER assessment, and the phase timeline. All data arrives via
 * props - no hook calls.
 *
 * Epic 26 SS26.1 rebuild (contract items 3, 5, 7):
 *  - The card used to offer ONE CTA for a phase that has two or more
 *    assessments, always `quizzes[0]`, so every other assessment was
 *    unreachable. Each assessment now gets its own CTA whose accessible name
 *    says which one it starts ("Take Listening Dictation"), and no row is
 *    chosen by position.
 *  - The timeline state is TEXT ("passed" / "current" / "later"), not an
 *    aria-hidden icon, and the current marker survives the phase being passed
 *    ("Phase 1 - passed - current").
 *  - No padlock: BM-1 makes every Learn surface open to everyone, so a phase the
 *    learner has not reached is LATER IN THE SEQUENCE, not locked.
 *
 * One saturated fill per viewport: the CTAs are `secondary`, so the card owns no
 * primary - a Browse page keeps its single primary for its own job.
 */
import type { QuizAssessment } from "../hooks/useQuizCard";
import type { PhaseTimelineState } from "../hooks/useQuizCard";
import { Box, Button, Icon } from "shared/components";
import "./QuizCard.css";

/** Minimal timeline shape this card needs - the hook passes the wider entry. */
type TimelineItem = {
  phase: number;
  isPassed: boolean;
  isCurrent: boolean;
  isLocked: boolean;
  state?: PhaseTimelineState;
  stateLabel?: string;
};

type QuizCardProps = {
  currentPhase: number;
  label: string;
  quizzes: QuizAssessment[];
  takeQuiz: (type: string) => void;
  timeline: TimelineItem[];
};

export function QuizCard({ currentPhase, label, quizzes, takeQuiz, timeline }: QuizCardProps) {
  return (
    <Box variant="dark" padding="lg" className="quiz-card flex-col gap-md">
      <h2 className="flex-align-center gap-xs font-xl fw-700 text-primary m-0">
        <Icon name="quiz" size={24} aria-hidden />
        Phase Quiz
      </h2>
      <p className="font-sm text-secondary m-0 lh-normal">
        Validate what you&apos;ve learned in this phase.
      </p>

      <p className="font-sm fw-600 text-primary m-0">
        Phase {currentPhase}: {label}
      </p>

      <QuizCardAssessments quizzes={quizzes} takeQuiz={takeQuiz} />

      <QuizCardTimeline timeline={timeline} currentPhase={currentPhase} />
    </Box>
  );
}

/** One labelled CTA per assessment - never one CTA for several. */
function QuizCardAssessments({
  quizzes,
  takeQuiz,
}: {
  quizzes: QuizAssessment[];
  takeQuiz: (type: string) => void;
}) {
  if (quizzes.length === 0) {
    return null;
  }

  return (
    <ul
      className="quiz-card__assessments flex-col gap-sm m-0 p-0"
      aria-label="Available assessments"
    >
      {quizzes.map((quiz) => (
        <li key={`${quiz.type}-${quiz.tier}`} className="flex-between gap-sm">
          <span className="font-sm text-secondary">{quiz.label}</span>
          <Button
            variant="secondary"
            size="sm"
            aria-label={`Take ${quiz.label}`}
            onClick={() => takeQuiz(quiz.type)}
          >
            Take
          </Button>
        </li>
      ))}
    </ul>
  );
}

/** Sequencing, never a lock - and the state is a word, not a hue. */
function QuizCardTimeline({
  timeline,
  currentPhase,
}: {
  timeline: TimelineItem[];
  currentPhase: number;
}) {
  return (
    <Box variant="divider" as="div" padding="sm">
      <ol className="quiz-card__timeline-list m-0 p-0 flex-col gap-xs" aria-label="Phase sequence">
        {timeline.map((entry) => {
          const isCurrent = entry.isCurrent || entry.phase === currentPhase;
          const stateLabel = entry.stateLabel ?? "";

          return (
            <li key={entry.phase} className="quiz-card__timeline-item flex-align-center gap-xs">
              {entry.isPassed ? (
                <Icon name="check" size={16} aria-hidden />
              ) : isCurrent ? (
                <Icon name="practice" size={16} aria-hidden />
              ) : null}
              <span className="font-xs text-secondary">Phase {entry.phase}</span>
              <span className="font-xs text-muted">· {stateLabel}</span>
            </li>
          );
        })}
      </ol>
    </Box>
  );
}
