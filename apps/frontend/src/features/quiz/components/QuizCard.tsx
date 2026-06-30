/**
 * QuizCard
 *
 * Self-contained quiz card for the Practices index page.
 * Shows the current phase, its available gate assessments, and a phase timeline.
 * Uses the useQuizCard hook for data and navigation.
 */
import { useQuizCard } from "../hooks/useQuizCard";

export function QuizCard() {
  const { currentPhase, label, quizzes, takeQuiz, timeline } = useQuizCard();

  return (
    <div className="card-dark p-lg flex-col gap-md">
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
            <p className="font-xs text-muted m-0 mt-xs">Available assessments:</p>
            {quizzes.map((q) => (
              <p key={q.type} className="font-sm text-secondary m-0">
                • {q.label}
              </p>
            ))}
          </div>
        )}
      </div>

      {quizzes.length > 0 && (
        <button
          className="btn-primary startBtn"
          onClick={() => takeQuiz(quizzes[0].type)}
          type="button"
        >
          📝 Take Phase {currentPhase} Quiz
          <span className="startBtnArrow">▸</span>
        </button>
      )}

      {/* Phase timeline */}
      <PhaseTimeline timeline={timeline} />
    </div>
  );
}

function PhaseTimeline({
  timeline,
}: {
  timeline: { phase: number; isPassed: boolean; isCurrent: boolean; isLocked: boolean }[];
}) {
  return (
    <div className="phase-timeline">
      {timeline.map((p) => (
        <span
          key={p.phase}
          className={`phase-timeline-item ${p.isPassed ? "phase-passed" : ""} ${p.isCurrent ? "phase-current" : ""} ${p.isLocked ? "phase-locked" : ""}`}
        >
          {p.isPassed ? "✅" : p.isCurrent ? "📌" : "🔒"} Phase {p.phase}
        </span>
      ))}
    </div>
  );
}
