/**
 * @file components/blueprint/BlueprintStepper.tsx
 * @description The Blueprint's position indicator — replaces the five sibling
 * tabs on the first-run path (rework-proposal §3).
 *
 * Presentational only: it shows WHERE the learner is in the sequence and lets
 * them jump back to a step already passed. It is intentionally not a tab bar —
 * a tab bar implies five parallel references, which is the thing this page
 * stopped being.
 */
import "./BlueprintStepper.css";
import type { BlueprintStepId } from "./blueprintSteps";
import { BLUEPRINT_STEPS } from "./blueprintSteps";

export type BlueprintStepperProps = {
  /** id of the step currently on screen. */
  currentId: BlueprintStepId;
  /** Jump to a step at or before the current one. */
  onJump: (id: BlueprintStepId) => void;
};

export function BlueprintStepper({ currentId, onJump }: BlueprintStepperProps) {
  const currentIndex = BLUEPRINT_STEPS.findIndex((step) => step.id === currentId);

  return (
    <nav aria-label="Blueprint steps">
      <ol className="blueprint-stepper flex items-center flex-wrap gap-xs m-0 p-0">
        {BLUEPRINT_STEPS.map((step, index) => {
          const state = index < currentIndex ? "done" : index === currentIndex ? "current" : "todo";
          const isReachable = index < currentIndex;
          return (
            <li key={step.id} className="flex items-center gap-xs min-w-0">
              <button
                type="button"
                className={`blueprint-stepper__step inline-flex items-center gap-xs font-xs radius-pill ${state === "current" ? "text-primary fw-600" : "text-tertiary"}`}
                aria-current={state === "current" ? "step" : undefined}
                disabled={!isReachable}
                onClick={() => onJump(step.id)}
              >
                <span className="blueprint-stepper__count text-center" aria-hidden="true">
                  {state === "done" ? "✓" : index + 1}
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
