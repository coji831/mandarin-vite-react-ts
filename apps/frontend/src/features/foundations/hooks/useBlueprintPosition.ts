/**
 * @file hooks/useBlueprintPosition.ts
 * @description The Blueprint's position record — how a returning learner
 * re-enters the seven-step walk without repeating it (rework-proposal §3
 * correction; BM-1 L2/L6 — sequencing is a suggestion, never a wall).
 *
 * Two facts are persisted, and nothing else:
 *   - `lastStepId` — the cursor, so `/learn/foundations` resumes instead of
 *     restarting at step 1 on every mount;
 *   - `completedAt` — the one-time onboarding signal, written by the step-7
 *     CTA. It changes COPY and the default CTA; it never gates a step.
 *
 * Storage is ONE device-local key (`foundations:blueprintPosition`), not an
 * identity-scoped cache like `phaseGate:*`. What is stored is a cursor and a
 * timestamp — no user data, no score, no content — so a second person on the
 * same device inherits a position, not an achievement, and BM-1 already lets
 * any visitor skip the walk. Identity-scoping it would buy nothing and would
 * owe an eviction hook in `AuthContext` that this surface does not own.
 */
import { useCallback, useState } from "react";
import { BLUEPRINT_STEPS, type BlueprintStepId } from "../components/blueprint/blueprintSteps";

const STORAGE_KEY = "foundations:blueprintPosition";

export type BlueprintPosition = {
  /** Step the learner was last on; `null` until they move off the first step. */
  lastStepId: BlueprintStepId | null;
  /** ISO timestamp of the first "Finish the Blueprint"; `null` until finished. */
  completedAt: string | null;
};

const EMPTY_POSITION: BlueprintPosition = { lastStepId: null, completedAt: null };

const STEP_IDS = new Set<string>(BLUEPRINT_STEPS.map((step) => step.id));

/** Narrow an arbitrary stored/URL string to a real step id. */
export function isBlueprintStepId(value: unknown): value is BlueprintStepId {
  return typeof value === "string" && STEP_IDS.has(value);
}

/**
 * Read the stored position. A corrupt, absent, or partially-valid value
 * degrades to `EMPTY_POSITION` field by field — a bad key never crashes the
 * page and never invalidates the good half.
 */
export function readBlueprintPosition(): BlueprintPosition {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_POSITION;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return EMPTY_POSITION;
    const { lastStepId, completedAt } = parsed as Record<string, unknown>;
    return {
      lastStepId: isBlueprintStepId(lastStepId) ? lastStepId : null,
      completedAt: typeof completedAt === "string" && completedAt ? completedAt : null,
    };
  } catch {
    // Private-mode / disabled storage / corrupt JSON — start from the top.
    return EMPTY_POSITION;
  }
}

export function writeBlueprintPosition(position: BlueprintPosition): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
  } catch {
    // Storage unavailable — the session still works, it just will not resume.
  }
}

export function clearBlueprintPosition(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to do — the key is already gone or unreachable.
  }
}

/**
 * The Blueprint's persisted position + the two writes the page performs.
 *
 * @returns position, recordStep (a step was shown), complete (the CTA ran)
 */
export function useBlueprintPosition() {
  const [position, setPosition] = useState<BlueprintPosition>(readBlueprintPosition);

  const recordStep = useCallback((stepId: BlueprintStepId) => {
    setPosition((previous) => {
      if (previous.lastStepId === stepId) return previous;
      const next = { ...previous, lastStepId: stepId };
      writeBlueprintPosition(next);
      return next;
    });
  }, []);

  const complete = useCallback(() => {
    setPosition((previous) => {
      // The completion timestamp is the FIRST finish; re-walking keeps it.
      if (previous.completedAt) return previous;
      const next = { ...previous, completedAt: new Date().toISOString() };
      writeBlueprintPosition(next);
      return next;
    });
  }, []);

  return { position, recordStep, complete };
}
