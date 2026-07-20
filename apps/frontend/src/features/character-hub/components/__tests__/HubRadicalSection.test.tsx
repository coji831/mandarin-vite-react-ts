/**
 * @file HubRadicalSection.test.tsx
 * @description Tests for HubRadicalSection component
 * Story 19.5: Character Hub Radical Section
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { HubRadicalSection } from "../HubRadicalSection";
import { loadMergedRadicals } from "../../services/mergeRadicals";

// Mock mergeRadicals service (vitest mockReset clears vi.fn() implementations
// between tests, so we set the resolved value in beforeEach instead).
vi.mock("../../services/mergeRadicals", () => ({
  loadMergedRadicals: vi.fn(),
}));

// Mock React Router
vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

// Mock shared hooks
vi.mock("shared/hooks", () => ({
  usePhaseGate: () => ({ phaseGate: { currentPhase: 2 } }),
}));

// Mock shared components
vi.mock("shared/components", () => ({
  Box: ({ children, variant, padding: _padding, className }: Record<string, unknown>) => (
    <div data-testid="mock-box" data-variant={variant as string} className={className as string}>
      {children as React.ReactNode}
    </div>
  ),
  Button: ({ children, onClick, ...props }: Record<string, unknown>) => (
    <button onClick={onClick as () => void} {...(props as Record<string, unknown>)}>
      {children as React.ReactNode}
    </button>
  ),
  Skeleton: ({ variant, className }: Record<string, unknown>) => (
    <div data-testid="skeleton" data-variant={variant as string} className={className as string} />
  ),
}));

const mockedLoadMergedRadicals = vi.mocked(loadMergedRadicals);

describe("HubRadicalSection", () => {
  beforeEach(() => {
    mockedLoadMergedRadicals.mockResolvedValue([
      { id: "rad_0001", glyph: "⺅", meaning: "person", name_pinyin: "rén" },
    ]);
  });

  it("renders loading skeleton when loading is true", () => {
    render(<HubRadicalSection character="好" onClose={vi.fn()} loading={true} />);
    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.getByLabelText("Loading radicals")).toBeTruthy();
  });

  it("renders radical chips after data loads", async () => {
    render(<HubRadicalSection character="好" onClose={vi.fn()} />);

    // Wait for async load to complete and component to re-render
    const chip = await screen.findByText("⺅", {}, { timeout: 3000 });
    expect(chip).toBeTruthy();
  });
});
