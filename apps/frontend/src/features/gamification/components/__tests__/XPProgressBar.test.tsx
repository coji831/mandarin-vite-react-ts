/**
 * XPProgressBar Component Tests
 * Story 15.7: Gamification & AI Feedback Display UI
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import XPProgressBar from "../XPProgressBar";

describe("XPProgressBar", () => {
  it("calculates and displays correct level", () => {
    render(<XPProgressBar currentXP={250} />);

    expect(screen.getByText("Level 2")).toBeInTheDocument();
  });

  it("displays XP within current level correctly", () => {
    render(<XPProgressBar currentXP={250} />);

    expect(screen.getByText("50 / 100 XP")).toBeInTheDocument();
  });

  it("shows correct progress bar percentage", () => {
    render(<XPProgressBar currentXP={340} />);

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveStyle({ width: "40%" });
    expect(progressBar).toHaveAttribute("aria-valuenow", "40");
  });

  it("handles level 0 correctly (XP < 100)", () => {
    render(<XPProgressBar currentXP={45} />);

    expect(screen.getByText("Level 0")).toBeInTheDocument();
    expect(screen.getByText("45 / 100 XP")).toBeInTheDocument();
  });

  it("handles exact level boundaries", () => {
    render(<XPProgressBar currentXP={300} />);

    expect(screen.getByText("Level 3")).toBeInTheDocument();
    expect(screen.getByText("0 / 100 XP")).toBeInTheDocument();

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveStyle({ width: "0%" });
  });

  it("handles high levels correctly", () => {
    render(<XPProgressBar currentXP={1575} />);

    expect(screen.getByText("Level 15")).toBeInTheDocument();
    expect(screen.getByText("75 / 100 XP")).toBeInTheDocument();
  });

  it("has proper accessibility attributes", () => {
    render(<XPProgressBar currentXP={230} />);

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuemin", "0");
    expect(progressBar).toHaveAttribute("aria-valuemax", "100");
    expect(progressBar).toHaveAttribute("aria-label", "Experience progress: 30 out of 100 XP");
  });

  it("renders with 0 XP", () => {
    render(<XPProgressBar currentXP={0} />);

    expect(screen.getByText("Level 0")).toBeInTheDocument();
    expect(screen.getByText("0 / 100 XP")).toBeInTheDocument();
  });
});
