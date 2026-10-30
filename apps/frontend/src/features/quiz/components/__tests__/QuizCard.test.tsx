/**
 * QuizCard - Epic 26 contract (SS26.1 items 3, 5, 7)
 *
 * The phase timeline is SEQUENCING, never a lock: BM-1 makes every Learn
 * surface open to everyone and leaves persistence as the only lock, so a phase
 * the learner has not reached is later, not padlocked. Emoji is not an icon
 * (ADR-010 / Q8), so the row marks itself with the shared `Icon` - and the
 * state itself is TEXT, so a learner who cannot see the mark still reads it.
 *
 * The card also offers ONE labelled CTA PER assessment: it used to render a
 * single "Take Phase N Quiz" bound to `quizzes[0]`, which left every other
 * assessment unreachable.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuizCard } from "../QuizCard";

const TIMELINE = [
  { phase: 1, isPassed: true, isCurrent: true, isLocked: false },
  { phase: 2, isPassed: false, isCurrent: false, isLocked: true },
  { phase: 3, isPassed: false, isCurrent: false, isLocked: true },
  { phase: 4, isPassed: false, isCurrent: false, isLocked: true },
];

const QUIZZES = [
  { label: "Audio to Pinyin & Tone", type: "audio-to-pinyin-tone", phase: 1, tier: 1 },
  { label: "Tone Judgment", type: "tone-judgment", phase: 1, tier: 1 },
];

function renderCard(takeQuiz = vi.fn()) {
  return render(
    <QuizCard
      currentPhase={1}
      label="The Blueprint - Foundations"
      quizzes={QUIZZES}
      takeQuiz={takeQuiz}
      timeline={TIMELINE}
    />,
  );
}

describe("QuizCard", () => {
  it("never claims a lock on an unreached phase", () => {
    const { container } = renderCard();

    expect(screen.queryByText(/🔒/)).toBeNull();
    expect(container.textContent).not.toMatch(/🔒|🔓/);
    expect(container.querySelector(".phase-locked")).toBeNull();
  });

  it("states every phase in the sequence, with its state as text", () => {
    renderCard();
    for (const phase of [2, 3, 4]) {
      expect(screen.getByText(new RegExp(`Phase ${phase}`))).toBeInTheDocument();
    }
    expect(screen.getAllByText(/Phase 1/).length).toBeGreaterThan(0);

    // Phase 1 is both passed and current - both words are stated.
    expect(screen.getByText(/passed · current/)).toBeInTheDocument();
    // Unreached phases are later in the sequence, said in words.
    expect(screen.getAllByText(/later/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/not passed/)).toBeNull();
  });

  it("uses the shared Icon rather than emoji for the markers", () => {
    const { container } = renderCard();

    // heading icon + the current-phase marker; unreached rows carry no mark.
    expect(container.querySelectorAll("svg.icon")).toHaveLength(2);
    expect(container.textContent).not.toMatch(/📝|✅|📌/);
  });

  it("offers one labelled CTA per assessment", async () => {
    const takeQuiz = vi.fn();
    renderCard(takeQuiz);

    expect(screen.getByRole("button", { name: "Take Audio to Pinyin & Tone" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Take Tone Judgment" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Take Tone Judgment" }));
    expect(takeQuiz).toHaveBeenCalledWith("tone-judgment");
  });
});
