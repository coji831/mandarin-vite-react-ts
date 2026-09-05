/**
 * @file shared/components/LockedSurface/__tests__/LockedSurface.test.tsx
 * @description Component tests for LockedSurface (Epic 25 S2) — the shared
 * route-gate fallback screen. Pure presentational (no fetch/router), so plain
 * `render` from @testing-library/react suffices.
 *
 * Asserts the DISPLAY output: label + neutral "Unlocks in Phase N." copy, the
 * lock icon, and the absence of any CTA (epic-26 NON-GOAL — no button/link).
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LockedSurface } from "../LockedSurface";

describe("LockedSurface", () => {
  it("renders the label + neutral phase-unlock copy", () => {
    render(<LockedSurface label="Grammar" requiredPhase={2} />);
    expect(screen.getByTestId("locked-surface")).toBeInTheDocument();
    expect(screen.getByText("Grammar")).toBeInTheDocument();
    expect(screen.getByText("Unlocks in Phase 2.")).toBeInTheDocument();
  });

  it("renders a lock icon and NO CTA (button/link) for any required phase", () => {
    const { container } = render(<LockedSurface label="Chengyu" requiredPhase={4} />);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
