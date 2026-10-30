/**
 * useQuizCard
 *
 * Hook for the QuizCard — provides phase gate data, quiz assessments,
 * navigation actions, and phase timeline info for the Practices index page.
 * Quizzes are read from PHASE_CONFIGS (single source of truth) and aggregated
 * across every phase up to the learner's current one, so a passed phase keeps
 * its assessments available as optional practice instead of disappearing.
 */
import { useNavigate } from "react-router-dom";
import { practices_quiz, withSearchParams } from "shared/constants";
import { usePhaseGate } from "shared/hooks";
import { getQuizzesUpToPhase } from "features/quiz";

export interface QuizAssessment {
  /** Human label, e.g. "IME Simulator". */
  label: string;
  /** Strategy id used in `?type=`. */
  type: string;
  /** Phase the assessment belongs to. */
  phase: number;
  /** Difficulty tier within the format; 1 unless the phase re-runs it harder. */
  tier: number;
}

/** Timeline state as text — never colour alone, never an aria-hidden icon. */
export type PhaseTimelineState = "passed" | "current" | "unpassed" | "later";

export interface PhaseTimelineEntry {
  phase: number;
  isPassed: boolean;
  isCurrent: boolean;
  isLocked: boolean;
  state: PhaseTimelineState;
  stateLabel: string;
}

const PHASE_LABELS: Record<number, string> = {
  1: "The Blueprint — Foundations",
  2: "The Core 300 — Radicals & Characters",
  3: "The Network — Reading & Grammar",
  4: "Advanced Fluidity — Mastery",
};

const QUIZ_LABELS: Record<string, string> = {
  "audio-to-pinyin-tone": "Audio to Pinyin & Tone",
  "ime-simulator": "IME Simulator",
  "radical-gate": "Radical Gate",
  "tone-judgment": "Tone Judgment",
  "listening-dictation": "Listening Dictation",
  cloze: "Cloze",
  "sentence-building": "Sentence Building",
};

export function quizLabel(type: string, tier: number): string {
  const base = QUIZ_LABELS[type] ?? type;
  return tier > 1 ? `${base} (tier ${tier})` : base;
}

export function useQuizCard() {
  const navigate = useNavigate();
  const { phaseGate } = usePhaseGate();
  const currentPhase = phaseGate?.currentPhase ?? 1;

  const label = PHASE_LABELS[currentPhase] ?? "";

  const quizzes: QuizAssessment[] = getQuizzesUpToPhase(currentPhase).map((q) => ({
    label: quizLabel(q.quizType, q.tier),
    type: q.quizType,
    phase: q.phase,
    tier: q.tier,
  }));

  const takeQuiz = (type: string) => {
    navigate(withSearchParams(practices_quiz, { type }));
  };

  const passedByPhase: Record<number, boolean> = {
    1: !!phaseGate?.phase1Passed,
    2: !!phaseGate?.phase2Passed,
    3: !!phaseGate?.phase3Passed,
    // Phase 4 is the last phase; the gate reports no completion flag for it.
    4: false,
  };

  const timeline: PhaseTimelineEntry[] = [1, 2, 3, 4].map((p) => {
    const isPassed = passedByPhase[p];
    const isCurrent = p === currentPhase;
    const isLocked = p > currentPhase;
    const state: PhaseTimelineState = isCurrent
      ? "current"
      : isPassed
        ? "passed"
        : p < currentPhase
          ? "unpassed"
          : "later";

    // The visible words are the single source: the card renders `stateLabel`
    // verbatim rather than re-deriving its own vocabulary.
    const words: string[] = [];
    if (isPassed) words.push("passed");
    if (isCurrent) words.push("current");
    if (!isPassed && !isCurrent) words.push(isLocked ? "later" : "not passed");

    return {
      phase: p,
      isPassed,
      isCurrent,
      isLocked,
      state,
      stateLabel: words.join(" · "),
    };
  });

  return { currentPhase, label, quizzes, takeQuiz, timeline };
}
