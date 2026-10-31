/**
 * @file features/quiz/hooks/__tests__/useQuizCard.test.tsx
 * @description Story 26-1 — the quiz engine tells the truth about phases.
 *
 * The Practices card used to render only the *current* phase's quizzes, so a
 * learner past Phase 1 lost every earlier assessment, a Phase-3 learner got an
 * empty list (no `PHASE_CONFIGS[3]`), and Phase 4's payload was byte-identical
 * to Phase 2's. These tests pin the four behaviours that fix it:
 * 1. every phase 1–4 is configured;
 * 2. Phase 4 is a distinct payload (tier 2), not a duplicate of Phase 2;
 * 3. the card aggregates every quiz for `phase <= currentPhase`;
 * 4. the timeline state is text, and the current phase keeps a current marker
 *    after it has been passed.
 */
import { renderHook } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { PHASE_CONFIGS, getQuizzesUpToPhase } from "../../engine/PhaseStrategyRegistry";
import { quizLabel, useQuizCard } from "../useQuizCard";

const phaseGate = vi.fn();

vi.mock("shared/hooks", () => ({
  usePhaseGate: () => phaseGate(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

function renderCard() {
  return renderHook(() => useQuizCard(), { wrapper });
}

describe("PHASE_CONFIGS", () => {
  it("configures every phase from 1 to 4", () => {
    expect(Object.keys(PHASE_CONFIGS).map(Number).sort()).toEqual([1, 2, 3, 4]);
    expect(PHASE_CONFIGS[3]?.quizzes.map((q) => q.quizType)).toEqual([
      "cloze",
      "sentence-building",
    ]);
  });

  it("gives phase 4 a payload distinct from phase 2", () => {
    const phase2 = PHASE_CONFIGS[2]!.quizzes;
    const phase4 = PHASE_CONFIGS[4]!.quizzes;

    const phase2Types = phase2.map((q) => q.quizType);
    expect(phase4.map((q) => q.quizType).every((type) => phase2Types.includes(type))).toBe(true);
    expect(phase4.every((q) => q.tier === 2)).toBe(true);
    for (const harder of phase4) {
      expect(phase2).not.toContainEqual(harder);
    }
  });
});

describe("getQuizzesUpToPhase", () => {
  it("returns only phase 1 assessments for a phase 1 learner", () => {
    expect(getQuizzesUpToPhase(1).map((q) => q.quizType)).toEqual([
      "audio-to-pinyin-tone",
      "tone-judgment",
    ]);
  });

  it("accumulates earlier phases instead of replacing them", () => {
    expect(getQuizzesUpToPhase(2).map((q) => q.quizType)).toEqual([
      "audio-to-pinyin-tone",
      "tone-judgment",
      "ime-simulator",
      "radical-gate",
      "listening-dictation",
    ]);
  });

  it("gives a phase 3 learner the reading formats rather than an empty list", () => {
    const types = getQuizzesUpToPhase(3).map((q) => q.quizType);

    expect(types).toContain("cloze");
    expect(types).toContain("sentence-building");
    expect(types).toHaveLength(7);
  });

  it("carries the owning phase and a numeric tier on every entry", () => {
    const entries = getQuizzesUpToPhase(4);

    expect(entries.filter((q) => q.phase === 4).every((q) => q.tier === 2)).toBe(true);
    expect(entries.filter((q) => q.phase < 4).every((q) => q.tier === 1)).toBe(true);
  });

  it("never returns a quiz from a phase above the current one", () => {
    const phases = getQuizzesUpToPhase(2).map((q) => q.phase);

    expect(Math.max(...phases)).toBe(2);
  });
});

describe("quizLabel", () => {
  it("names every registered format instead of falling through to its id", () => {
    expect(quizLabel("cloze", 1)).toBe("Cloze");
    expect(quizLabel("sentence-building", 1)).toBe("Sentence Building");
    expect(quizLabel("listening-dictation", 1)).toBe("Listening Dictation");
    expect(quizLabel("tone-judgment", 1)).toBe("Tone Judgment");
  });

  it("marks a tier-2 re-run so phase 4 is not mistaken for phase 2", () => {
    expect(quizLabel("ime-simulator", 2)).toBe("IME Simulator (tier 2)");
  });
});

describe("useQuizCard", () => {
  beforeEach(() => {
    phaseGate.mockReturnValue({
      phaseGate: {
        currentPhase: 1,
        phase1Passed: false,
        phase2Passed: false,
        phase3Passed: false,
      },
    });
  });

  it("aggregates every quiz up to the current phase", () => {
    phaseGate.mockReturnValue({
      phaseGate: {
        currentPhase: 2,
        phase1Passed: true,
        phase2Passed: false,
        phase3Passed: false,
      },
    });

    const { result } = renderCard();

    expect(result.current.quizzes).toHaveLength(5);
    expect(result.current.quizzes[0]).toMatchObject({ type: "audio-to-pinyin-tone", phase: 1 });
    expect(result.current.quizzes[result.current.quizzes.length - 1]).toMatchObject({
      type: "listening-dictation",
      phase: 2,
    });
  });

  it("defaults a guest (no gate) to phase 1", () => {
    phaseGate.mockReturnValue({ phaseGate: null });

    const { result } = renderCard();

    expect(result.current.currentPhase).toBe(1);
    expect(result.current.quizzes.every((q) => q.phase === 1)).toBe(true);
  });

  it("keeps a current marker on the current phase after it was passed", () => {
    phaseGate.mockReturnValue({
      phaseGate: {
        currentPhase: 2,
        phase1Passed: true,
        phase2Passed: true,
        phase3Passed: false,
      },
    });

    const { result } = renderCard();
    const timeline = result.current.timeline;

    expect(timeline.find((p) => p.phase === 2)).toMatchObject({
      state: "current",
      isCurrent: true,
      isPassed: true,
    });
    expect(timeline.find((p) => p.phase === 1)).toMatchObject({
      state: "passed",
      stateLabel: "passed",
    });
  });

  it("states every timeline phase as text, never as an unlabelled icon", () => {
    const { result } = renderCard();

    for (const entry of result.current.timeline) {
      expect(entry.stateLabel).toBeTruthy();
    }
    expect(result.current.timeline.map((p) => p.state)).toEqual([
      "current",
      "later",
      "later",
      "later",
    ]);
  });

  it("keeps a passed phase's assessment available as optional practice", () => {
    phaseGate.mockReturnValue({
      phaseGate: {
        currentPhase: 3,
        phase1Passed: true,
        phase2Passed: true,
        phase3Passed: false,
      },
    });

    const { result } = renderCard();

    expect(result.current.quizzes.map((q) => q.type)).toContain("ime-simulator");
    expect(result.current.timeline.every((p) => !p.stateLabel.includes("locked"))).toBe(true);
  });
});
