/**
 * @file HubRadicalSection.test.tsx
 * @description Tests for HubRadicalSection component
 * Story 19.5: Character Hub Radical Section
 * Story 21.x (visual wave): chips call openHub({entityType:"radical", ...}) in-place.
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { HubRadicalSection } from "../../HubRadicalSection/HubRadicalSection";

// Hoisted mock function that survives mockReset
const { mockUseMergedRadicals, mockOpenHub } = vi.hoisted(() => ({
  mockUseMergedRadicals: vi.fn(),
  mockOpenHub: vi.fn(),
}));

vi.mock("../../../hooks/useMergedRadicals", () => ({
  useMergedRadicals: mockUseMergedRadicals,
}));

// Mock the shared hub entry point (openHub)
vi.mock("shared/store", () => ({
  openHub: mockOpenHub,
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

describe("HubRadicalSection", () => {
  beforeEach(() => {
    mockUseMergedRadicals.mockReturnValue({
      radicals: [{ id: "rad_0001", glyph: "⺅", meaning: "person", name_pinyin: "rén" }],
      isLoading: false,
      error: null,
      retry: vi.fn(),
    });
  });

  it("renders loading skeleton when external loading prop is true", () => {
    render(<HubRadicalSection character="好" loading={true} />);
    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.getByLabelText("Loading radicals")).toBeTruthy();
  });

  it("renders radical chips after data loads", async () => {
    render(<HubRadicalSection character="好" />);

    const chip = await screen.findByText("⺅", {}, { timeout: 3000 });
    expect(chip).toBeTruthy();
  });

  it("opens the radical in the same hub when a chip is clicked", async () => {
    render(<HubRadicalSection character="好" />);

    const chip = await screen.findByText("⺅", {}, { timeout: 3000 });
    fireEvent.click(chip);

    expect(mockOpenHub).toHaveBeenCalledWith({
      entityType: "radical",
      entityId: "rad_0001",
      label: "⺅ (rén)",
    });
  });
});
