/**
 * @file pages/learn/foundations/FoundationsPage.tsx
 * @description The Blueprint — week 1 as ONE sequential task (rework-proposal §3),
 * made re-enterable so the walk is a first-run guide, not a treadmill.
 *
 * `/learn/foundations` is a `wizard` / Focus surface: one step per screen, one
 * primary `Continue` at the bottom of the step, `Back` as the ghost, and a
 * stepper showing where the learner is in the seven-step sequence (initials →
 * finals → 4 tones → tone pairs → stroke order → first radicals → first 20
 * characters).
 *
 * ENTRY (correction to §3 — the walk used to restart at step 1 on every mount,
 * and the stepper refused every step ahead of the current one, so a returning
 * learner had to press Continue six times to reach "radicals"):
 *   - the step on screen resolves `?step=` → the persisted cursor → step 1;
 *   - every step in the stepper is operable, so any section is one click away;
 *   - `Finish the Blueprint` records `completedAt`, which changes this page's
 *     copy and its last-step CTA and nothing else — BM-1 L2/L6 make the order a
 *     suggestion, so completion never gates a step or a section.
 * The signal lives in `useBlueprintPosition` (one device-local key).
 *
 * The dense 409-cell reference is NOT here — it is its own route,
 * `/learn/foundations/reference` (`reports` / Browse), linked from the header of
 * every step and back again from its own header. A tab bar of five sibling
 * references was the original bug: it read as a lookup surface, so nobody
 * finished it.
 *
 * Story 18.1: Foundations Page Structure
 * Story 21.21: Pictograph Warmup (now in the reference index)
 * Rework §1: the old Pictographs tab lock is gone with the tabs — phase is
 * sequencing metadata only.
 */
import { useNavigate } from "react-router-dom";
import { Button, PageHeader, PageShell, PageStack } from "shared/components";
import { learn_foundations_reference, SEARCH_PARAMS } from "shared/constants";
import { useSearchParamState } from "shared/hooks";
import {
  BLUEPRINT_STEPS,
  BlueprintStepBody,
  BlueprintStepper,
  FoundationsProgressBar,
  isBlueprintStepId,
  useBlueprintPosition,
  type BlueprintStepId,
} from "features/foundations";

const FIRST_STEP_ID = BLUEPRINT_STEPS[0].id;

function indexOfStep(id: BlueprintStepId): number {
  return BLUEPRINT_STEPS.findIndex((step) => step.id === id);
}

export function FoundationsPage() {
  const navigate = useNavigate();
  const { position, recordStep, complete } = useBlueprintPosition();

  // `?step=` is sub-state (replace, never push): Back still exits the page.
  // An unknown value degrades to the default rather than crashing the step body.
  const [stepParam, setStepParam] = useSearchParamState<string>(SEARCH_PARAMS.step, {
    defaultValue: "",
    parse: (raw) => (isBlueprintStepId(raw) ? raw : null),
  });

  // URL wins (shareable / deep-linked step), then the stored cursor, then the top.
  const activeId = isBlueprintStepId(stepParam)
    ? stepParam
    : (position.lastStepId ?? FIRST_STEP_ID);
  const index = Math.max(indexOfStep(activeId), 0);

  const step = BLUEPRINT_STEPS[index];
  const isLast = index === BLUEPRINT_STEPS.length - 1;
  const isComplete = position.completedAt !== null;

  const goTo = (nextIndex: number) => {
    const target = BLUEPRINT_STEPS[Math.min(Math.max(nextIndex, 0), BLUEPRINT_STEPS.length - 1)];
    recordStep(target.id);
    setStepParam(target.id);
  };

  const handleJump = (id: BlueprintStepId) => goTo(indexOfStep(id));

  const finishBlueprint = () => {
    // Finishing is also a position: record the step the CTA was pressed on so a
    // later bare `/learn/foundations` resumes there instead of jumping back.
    recordStep(step.id);
    complete();
    navigate(learn_foundations_reference);
  };

  return (
    <PageShell archetype="wizard">
      <PageStack size="default">
        {/* Wayfinding block: where you are in the walk, then the one way out of
            it into the reference. The exit sits under the sequence rather than
            beside the step's h1 so the step keeps the full measure at 320px and
            the task keeps its single focal point. */}
        <div className="flex items-center gap-sm flex-wrap">
          <BlueprintStepper currentId={step.id} onJump={handleJump} />
          <Button variant="ghost" size="sm" onClick={() => navigate(learn_foundations_reference)}>
            Reference
          </Button>
        </div>

        {/* The step's own header: one task, named as a task. */}
        <PageHeader
          eyebrow={`Step ${index + 1} of ${BLUEPRINT_STEPS.length}${
            isComplete ? " · Blueprint complete" : ""
          }`}
          title={step.title}
          description={step.description}
        />

        <BlueprintStepBody stepId={step.id} />

        <div className="flex items-center gap-sm flex-wrap">
          {index > 0 && (
            <Button variant="ghost" onClick={() => goTo(index - 1)}>
              Back
            </Button>
          )}
          {isLast ? (
            <Button variant="primary" onClick={finishBlueprint}>
              {isComplete ? "Open the reference" : "Finish the Blueprint"}
            </Button>
          ) : (
            <Button variant="primary" onClick={() => goTo(index + 1)}>
              Continue
            </Button>
          )}
        </div>

        <FoundationsProgressBar />
      </PageStack>
    </PageShell>
  );
}
