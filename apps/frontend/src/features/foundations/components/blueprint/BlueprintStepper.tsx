/**
 * @file components/blueprint/BlueprintStepper.tsx
 * @description The Blueprint's position indicator AND its jump menu
 * (rework-proposal §3; corrected for the "forced walk" regression).
 *
 * It shows WHERE the learner is in the seven-step sequence. Every step is
 * operable: the order is a suggestion, not a gate (BM-1 L2/L6 — gates are
 * recommendations, never walls), so a returning learner can go straight to
 * "tones" or "radicals" instead of pressing Continue five times. The guided
 * reading is preserved by the primary CTA staying `Continue` at the bottom of
 * each step — this stays a stepper, not a tab bar: the items are numbered
 * positions in ONE path and the current one is announced with
 * `aria-current="step"`, while a tab bar would imply parallel references.
 */
import "./BlueprintStepper.css";
import type { BlueprintStepId } from "./blueprintSteps";
import { BLUEPRINT_STEPS } from "./blueprintSteps";

export type BlueprintStepperProps = {
  /** id of the step currently on screen. */
  currentId: BlueprintStepId;
  /** Jump to any step — forward (skip) or back. Never gated. */
  onJump: (id: BlueprintStepId) => void;
};

export function BlueprintStepper({ currentId, onJump }: BlueprintStepperProps) {
  const currentIndex = BLUEPRINT_STEPS.findIndex((step) => step.id === currentId);

  return (
    <nav aria-label="Blueprint steps">
      <ol className="blueprint-stepper flex items-center flex-wrap gap-xs m-0 p-0">
        {BLUEPRINT_STEPS.map((step, index) => {
          const isCurrent = index === currentIndex;
          const isDone = index < currentIndex;
          // Past and current steps read as the path walked; steps ahead read
          // quieter — skip targets, never disabled, never faded to illegible.
          const tone = isCurrent
            ? "text-primary fw-600"
            : isDone
              ? "text-secondary"
              : "text-tertiary";
          return (
            <li key={step.id} className="flex items-center gap-xs min-w-0">
              <button
                type="button"
                className={`blueprint-stepper__step inline-flex items-center gap-xs font-xs radius-pill ${tone}`}
                aria-current={isCurrent ? "step" : undefined}
                onClick={() => onJump(step.id)}
              >
                <span className="blueprint-stepper__count text-center" aria-hidden="true">
                  {isDone ? "✓" : index + 1}
                </span>
                <span>{step.label}</span>
              </button>
              {index < BLUEPRINT_STEPS.length - 1 && (
                <span className="blueprint-stepper__rule" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
