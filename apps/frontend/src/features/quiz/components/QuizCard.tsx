/**
 * QuizCard
 *
 * Presentational quiz card for the Practices index page.
 * Shows the current phase, its available gate assessments, and a phase timeline.
 * All data is received via props — no direct hook calls.
 */
import type { QuizAssessment } from "../hooks/useQuizCard";
import { Box, Button } from "shared/components";

type TimelineItem = {
  phase: number;
  isPassed: boolean;
  isCurrent: boolean;
  isLocked: boolean;
};

type QuizCardProps = {
  isGuest: boolean;
  currentPhase: number;
  label: string;
  quizzes: QuizAssessment[];
  takeQuiz: (type: string) => void;
  timeline: TimelineItem[];
};

export function QuizCard({
  isGuest,
  currentPhase,
  label,
  quizzes,
  takeQuiz,
  timeline,
}: QuizCardProps) {
  return (
    <Box variant="dark" padding="lg" className="flex-col gap-md">
      <h2 className="font-2xl fw-700 text-primary m-0">📝 Phase Quiz</h2>
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
          📝 Take Phase {currentPhase} Quiz
          <span>▸</span>
        </Button>
      )}

      {/* Phase timeline */}
      <PhaseTimeline timeline={timeline} isGuest={isGuest} />
    </Box>
  );
}

function PhaseTimeline({
  timeline,
  isGuest = false,
}: {
  timeline: { phase: number; isPassed: boolean; isCurrent: boolean; isLocked: boolean }[];
  isGuest?: boolean;
}) {
  return (
    <Box variant="divider" as="div" className="phase-timeline">
      {timeline.map((p) => {
        const effectiveLocked = isGuest ? false : p.isLocked;
        return (
          <span
            key={p.phase}
            className={`phase-timeline-item ${effectiveLocked ? "phase-locked text-muted" : ""} ${p.isPassed ? "phase-passed" : ""} ${p.isCurrent ? "phase-current" : ""}`}
          >
            {p.isPassed ? "✅" : p.isCurrent ? "📌" : effectiveLocked ? "🔒" : "🔓"} Phase {p.phase}
          </span>
        );
      })}
    </Box>
  );
}
