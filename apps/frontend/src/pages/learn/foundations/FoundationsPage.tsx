/**
 * @file pages/learn/foundations/FoundationsPage.tsx
 * @description The Blueprint — week 1 as ONE sequential task (rework-proposal §3).
 *
 * `/learn/foundations` is a `wizard` / Focus surface: one step per screen, one
 * primary `Continue` at the bottom of the step, `Back` as the ghost, and a
 * stepper in the chrome showing where the learner is in the seven-step sequence
 * (initials → finals → 4 tones → tone pairs → stroke order → first radicals →
 * first 20 characters).
 *
 * The dense 409-cell reference is NOT here any more — it moved to
 * `/learn/foundations/reference` (`reports` / Browse), one ghost link away and
 * also linked per step ("see every final"). A tab bar of five sibling
 * references was the bug: it read as a lookup surface, so nobody finished it.
 *
 * Story 18.1: Foundations Page Structure
 * Story 21.21: Pictograph Warmup (now in the reference index)
 * Rework §1: the old Pictographs tab lock is gone with the tabs — phase is
 * sequencing metadata only.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, PageHeader, PageShell, PageStack } from "shared/components";
import { learn_foundations } from "shared/constants";
import {
  BLUEPRINT_STEPS,
  BlueprintStepBody,
  BlueprintStepper,
  FoundationsProgressBar,
  type BlueprintStepId,
} from "features/foundations";

const REFERENCE_PATH = `${learn_foundations}/reference`;

export function FoundationsPage() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);

  const step = BLUEPRINT_STEPS[index];
  const isLast = index === BLUEPRINT_STEPS.length - 1;

  const goTo = (nextIndex: number) => {
    setIndex(Math.min(Math.max(nextIndex, 0), BLUEPRINT_STEPS.length - 1));
  };

  const handleJump = (id: BlueprintStepId) => {
    const target = BLUEPRINT_STEPS.findIndex((s) => s.id === id);
    if (target >= 0 && target <= index) setIndex(target);
  };

  return (
    <PageShell archetype="wizard">
      <PageStack size="default">
        <BlueprintStepper currentId={step.id} onJump={handleJump} />

        {/* The step's own header: one task, named as a task. */}
        <PageHeader
          eyebrow={`Step ${index + 1} of ${BLUEPRINT_STEPS.length}`}
          title={step.title}
          description={step.description}
        />

        <BlueprintStepBody stepId={step.id} />

        <div className="flex-col gap-sm">
          <div className="flex items-center gap-sm flex-wrap">
            {index > 0 && (
              <Button variant="ghost" onClick={() => goTo(index - 1)}>
                Back
              </Button>
            )}
            {isLast ? (
              <Button
                variant="primary"
                onClick={() => navigate(`${REFERENCE_PATH}?tab=pictographs`)}
              >
                Finish the Blueprint
              </Button>
            ) : (
              <Button variant="primary" onClick={() => goTo(index + 1)}>
                Continue
              </Button>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate(REFERENCE_PATH)}>
            See every initial, final, tone and stroke in the reference
          </Button>
        </div>

        <FoundationsProgressBar />
      </PageStack>
    </PageShell>
  );
}
