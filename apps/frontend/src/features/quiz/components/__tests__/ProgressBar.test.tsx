/**
 * Tests for ProgressBar component
 * Component Reorganization: Renamed from QuizProgressBar
 * Story 15.6: Quiz Container & State Management
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProgressBar } from "../progress/ProgressBar";

describe("ProgressBar", () => {
  it("renders current and total count", () => {
    render(<ProgressBar current={2} total={5} />);
    expect(screen.getByText("2 / 5")).toBeInTheDocument();
  });

  it("calculates percentage correctly", () => {
    const { container } = render(<ProgressBar current={1} total={4} />);
    const progressFill = container.querySelector(".progress-fill");
    expect(progressFill).toHaveStyle({ width: "25%" });
  });

  it("shows 0% for first question not yet answered", () => {
    const { container } = render(<ProgressBar current={0} total={3} />);
    const progressFill = container.querySelector(".progress-fill");
    expect(progressFill).toHaveStyle({ width: "0%" });
  });

  it("shows 100% when all questions completed", () => {
    const { container } = render(<ProgressBar current={3} total={3} />);
    const progressFill = container.querySelector(".progress-fill");
    expect(progressFill).toHaveStyle({ width: "100%" });
  });

  it("renders progress bar structure", () => {
    const { container } = render(<ProgressBar current={1} total={3} />);

    const progressContainer = container.querySelector(".progress-container");
    const progressBar = container.querySelector(".progress-bar");
    const progressFill = container.querySelector(".progress-fill");

    expect(progressContainer).toBeInTheDocument();
    expect(progressBar).toBeInTheDocument();
    expect(progressFill).toBeInTheDocument();
  });
});
