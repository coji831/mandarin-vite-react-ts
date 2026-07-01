/**
 * useQuizCard
 *
 * Hook for the QuizCard — provides phase gate data, quiz assessments,
 * navigation actions, and phase timeline info for the Practices index page.
 * Quizzes are read from PHASE_CONFIGS (single source of truth).
 */
import { useNavigate } from "react-router-dom";
import { practices_quiz } from "shared/constants";
import { usePhaseGate } from "shared/hooks";
import { getPhaseQuizzes } from "features/quiz";

export interface QuizAssessment {
  label: string;
  type: string;
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
};

export function useQuizCard() {
  const navigate = useNavigate();
  const { phaseGate } = usePhaseGate();
  const currentPhase = phaseGate?.currentPhase ?? 1;

  const label = PHASE_LABELS[currentPhase] ?? "";

  // Read quizzes from PHASE_CONFIGS (single source of truth)
  const phaseQuizzes = getPhaseQuizzes(currentPhase);
  const quizzes: QuizAssessment[] = phaseQuizzes.map((q) => ({
    label: QUIZ_LABELS[q.quizType] ?? q.quizType,
    type: q.quizType,
  }));

  const takeQuiz = (type: string) => {
    navigate(`${practices_quiz}?type=${type}`);
  };

  const timeline = [1, 2, 3, 4].map((p) => ({
    phase: p,
    isPassed:
      p === 1
        ? !!phaseGate?.phase1Passed
        : p === 2
          ? !!phaseGate?.phase2Passed
          : p === 3
            ? !!phaseGate?.phase3Passed
            : false,
    isCurrent: p === currentPhase,
    isLocked: p > currentPhase,
  }));

  return { currentPhase, label, quizzes, takeQuiz, timeline };
}
