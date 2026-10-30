/**
 * QuizCard
 *
 * Presentational quiz card for the Practices index page.
 * Shows the current phase, its available gate assessments, and a phase timeline.
 * All data is received via props — no direct hook calls.
 *
 * Rework (§1 close-out): the timeline no longer prints a padlock. BM-1 makes
 * every Learn surface open to everyone and leaves persistence as the only lock,
 * so a phase the learner has not reached is LATER IN THE SEQUENCE, not locked —
 * it showed 🔒 Phase 2/3/4 on a page where every one of those surfaces opens.
 * The row states what is true (passed / current / later) in the shared `Icon`,
 * not emoji (ADR-010 / Q8).
 */
import type { QuizAssessment } from "../hooks/useQuizCard";
import { Box, Button, Icon } from "shared/components";

type TimelineItem = {
  phase: number;
  isPassed: boolean;
  isCurrent: boolean;
  isLocked: boolean;
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
    <Box variant="dark" padding="lg" className="flex-col gap-md">
      <h2 className="flex-align-center gap-xs font-2xl fw-700 text-primary m-0">
        <Icon name="quiz" size={24} aria-hidden />
        Phase Quiz
      </h2>
      <p className="font-sm text-secondary m-0 lh-normal">
        Validate what you've learned in this phase.
      </p>

      <div className="flex-col gap-xs">
        <p className="font-sm fw-600 text-primary m-0">
          Phase {currentPhase}: {label}
        </p>
        {quizzes.length > 0 && (
          <div className="flex-col gap-xs">
            <p className="font-xs text-muted m-0">Available assessments:</p>
            {quizzes.map((q) => (
              <p key={q.type} className="font-sm text-secondary m-0">
                • {q.label}
              </p>
            ))}
          </div>
        )}
      </div>

      {quizzes.length > 0 && (
        <Button variant="primary" onClick={() => takeQuiz(quizzes[0].type)}>
          Take Phase {currentPhase} Quiz
          <span aria-hidden="true">▸</span>
        </Button>
      )}

      {/* Phase timeline — sequencing, never a lock */}
      <PhaseTimeline timeline={timeline} />
    </Box>
  );
}

function PhaseTimeline({ timeline }: { timeline: TimelineItem[] }) {
  return (
    <Box variant="divider" as="div" className="phase-timeline">
      {timeline.map((p) => {
        const isCurrent = !p.isPassed && p.isCurrent;
        return (
          <span
            key={p.phase}
            className={`phase-timeline-item ${p.isPassed ? "phase-passed" : ""} ${isCurrent ? "phase-current" : ""}`}
          >
            {p.isPassed ? (
              <Icon name="check" size={16} aria-hidden />
            ) : isCurrent ? (
              <Icon name="practice" size={16} aria-hidden />
            ) : null}{" "}
            Phase {p.phase}
          </span>
        );
      })}
    </Box>
  );
}
