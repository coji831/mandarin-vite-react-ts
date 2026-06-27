/**
 * PracticesPage
 *
 * Practices index page showing Review and Quiz cards (Wireframe Section 7.5).
 * Review card: single entry point to ReviewPage for spaced repetition.
 * Quiz card: phase-gated assessments with lock/unlock indicators.
 *
 * Story 17.7: Added as global nav item matching wireframe.
 * Story 15.x: Replaced placeholder with quiz selection cards.
 * Wireframe 7.5: Redesigned with Review + Quiz cards per spec.
 * Story 19.6: Added IME Simulator quiz button with phase gating.
 */
import { useNavigate } from "react-router-dom";
import { practices_review, practices_quiz } from "../../shared/constants/paths";
import { usePhaseGate } from "shared/hooks";
import "./PracticesPage.css";

const BASE_PHASES = [
  { name: "Phase 1: Foundations Quiz (pinyin + tone)" },
  { name: "Phase 2: IME Simulator Quiz" },
  { name: "Phase 3: Reading Comprehension" },
] as const;

export default function PracticesPage() {
  const navigate = useNavigate();
  const { phaseGate, isLoading } = usePhaseGate();
  const currentPhase = phaseGate?.currentPhase ?? 1;

  const quizPhases = BASE_PHASES.map((phase, i) => ({
    ...phase,
    unlocked: i + 1 <= currentPhase,
  }));

  return (
    <div className="flex-col gap-lg mx-auto" style={{ maxWidth: 700 }}>
      <div className="text-center flex-col gap-xs">
        <h1 className="font-4xl fw-800 text-primary m-0">🎯 Practices</h1>
        <p className="font-md text-muted m-0">Review and Quiz</p>
      </div>

      <div className="cardGrid">
        {/* ── Review Card ── */}
        <div className="card-dark p-lg flex-col gap-md">
          <div className="flex-col gap-sm">
            <h2 className="font-2xl fw-700 text-primary m-0">🃏 Review</h2>
            <p className="font-sm text-secondary m-0 lh-normal">
              Daily spaced repetition — active recall: hear audio → type pinyin → select tone
            </p>
          </div>

          <div className="flex-col gap-xs">
            <p className="font-sm text-secondary m-0">• No timer, no scoring</p>
            <p className="font-sm text-secondary m-0">• Self-rated: Again / Good / Easy</p>
            <p className="font-sm text-secondary m-0">• Available after Phase 1</p>
          </div>

          <button className="btn-primary startBtn" onClick={() => navigate(practices_review)}>
            Start Review
            <span className="startBtnArrow">▸</span>
          </button>
        </div>

        {/* ── Quiz Card ── */}
        <div className="card-dark p-lg flex-col gap-md">
          <div className="flex-col gap-sm">
            <h2 className="font-2xl fw-700 text-primary m-0">📝 Phase Quiz</h2>
            <p className="font-sm text-secondary m-0 lh-normal">
              Timed assessment — pass to unlock next phase
            </p>
          </div>

          <div className="flex-col gap-sm">
            {quizPhases.map((phase) => (
              <div
                key={phase.name}
                className={`flex-between ${!phase.unlocked ? "op-60 cursor-not-allowed" : ""}`}
              >
                <span className="font-sm">• {phase.name}</span>
                <span className="font-sm whitespace-nowrap">
                  {phase.unlocked ? "\u{1F513} Ready" : "\u{1F512} Locked"}
                </span>
              </div>
            ))}
          </div>

          <button
            className="btn-primary startBtn"
            onClick={() => navigate(`${practices_quiz}?type=audio-to-pinyin-tone`)}
          >
            Start Foundations Quiz
            <span className="startBtnArrow">▸</span>
          </button>

          <button
            className={`btn-primary startBtn ${currentPhase < 2 ? "op-60" : ""}`}
            onClick={() => {
              if (currentPhase >= 2) {
                navigate(`${practices_quiz}?type=ime-simulator`);
              }
            }}
            title={currentPhase < 2 ? "Complete Phase 1 to unlock" : "Start IME Simulator Quiz"}
          >
            {currentPhase >= 2 ? "\u{1F513} " : "\u{1F512} "}Start IME Simulator
            <span className="startBtnArrow">▸</span>
          </button>
        </div>
      </div>
    </div>
  );
}
