/**
 * @file features/review/components/__tests__/ReviewComplete.test.tsx
 * @description Tests for the completion screen's ONE primary action (§1/BM-1):
 * a guest meets the single persistence ask here (post-rating), a registered
 * learner gets the next session in the same slot. Colour is never the sole
 * indicator of a rating, so the breakdown is text (no 🔴🟡🟢).
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ReviewComplete } from "../ReviewComplete";

const RESULT = {
  pinyinCorrect: 3,
  pinyinTotal: 4,
  toneCorrect: 2,
  toneTotal: 3,
  ratings: { easy: 1, good: 2, again: 1 },
};

function renderComplete(props: Partial<React.ComponentProps<typeof ReviewComplete>> = {}) {
  return render(
    <MemoryRouter>
      <ReviewComplete
        result={RESULT}
        totalItems={4}
        onReviewAgain={vi.fn()}
        onBack={vi.fn()}
        {...props}
      />
    </MemoryRouter>,
  );
}

describe("ReviewComplete", () => {
  it("gives a registered learner Review Again as the only primary", async () => {
    const onReviewAgain = vi.fn();
    renderComplete({ onReviewAgain });

    await userEvent.click(screen.getByRole("button", { name: "Review Again" }));
    expect(onReviewAgain).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole("button", { name: /Create an account to keep this queue/i }),
    ).toBeNull();
  });

  it("gives a guest the single persistence ask instead", () => {
    renderComplete({ isGuest: true });

    expect(
      screen.getByRole("button", { name: /Create an account to keep this queue/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Review Again" })).toBeNull();
  });

  it("labels the ratings in text — never colour or emoji alone", () => {
    renderComplete();

    expect(screen.getByText("Again:")).toBeInTheDocument();
    expect(screen.getByText("Good:")).toBeInTheDocument();
    expect(screen.getByText("Easy:")).toBeInTheDocument();
    expect(screen.queryByText(/🔴|🟡|🟢/)).toBeNull();
  });
});
