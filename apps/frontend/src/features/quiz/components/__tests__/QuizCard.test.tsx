/**
 * QuizCard — §1 close-out contract
 *
 * The phase timeline is SEQUENCING, never a lock: BM-1 makes every Learn
 * surface open to everyone and leaves persistence as the only lock, so a phase
 * the learner has not reached is later, not padlocked. Emoji is not an icon
 * (ADR-010 / Q8), so the row marks itself with the shared `Icon`.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QuizCard } from "../QuizCard";

const TIMELINE = [
  { phase: 1, isPassed: false, isCurrent: true, isLocked: false },
  { phase: 2, isPassed: false, isCurrent: false, isLocked: true },
  { phase: 3, isPassed: false, isCurrent: false, isLocked: true },
  { phase: 4, isPassed: false, isCurrent: false, isLocked: true },
];

const QUIZZES = [{ type: "audio-to-pinyin-tone", label: "Audio to Pinyin & Tone" }];

function renderCard() {
  return render(
    <QuizCard
      currentPhase={1}
      label="The Blueprint — Foundations"
      quizzes={QUIZZES}
      takeQuiz={vi.fn()}
      timeline={TIMELINE}
    />,
  );
}

describe("QuizCard", () => {
  it("never claims a lock on an unreached phase", () => {
    const { container } = renderCard();

    // The padlock glyphs are gone — and so is the `phase-locked` styling.
    expect(screen.queryByText(/🔒/)).toBeNull();
    expect(container.textContent).not.toMatch(/🔒|🔓/);
    expect(container.querySelector(".phase-locked")).toBeNull();
  });

  it("still states every phase in the sequence", () => {
    renderCard();
    for (const phase of [2, 3, 4]) {
      expect(screen.getByText(new RegExp(`Phase ${phase}`))).toBeInTheDocument();
    }
    // Phase 1 is both the current phase line and the timeline chip.
    expect(screen.getAllByText(/Phase 1/).length).toBeGreaterThan(0);
  });

  it("uses the shared Icon rather than emoji for the markers", () => {
    const { container } = renderCard();

    // heading icon + the current-phase marker; the unreached rows carry no mark.
    expect(container.querySelectorAll("svg.icon")).toHaveLength(2);
    expect(container.textContent).not.toMatch(/📝|✅|📌/);
  });
});
