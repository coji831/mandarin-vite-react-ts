/**
 * @file HubActions.test.tsx
 * @description Tests for HubActions component
 * Story 18.5: Character Detail Hub (Phase 1 Minimal)
 */

/// <reference types="@testing-library/jest-dom" />
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { HubActions } from "../../HubActions/HubActions";

const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }));

vi.mock("features/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("shared/hooks", () => ({
  useReview: () => ({
    saveToReview: vi.fn().mockResolvedValue(true),
    markLearned: vi.fn().mockResolvedValue(true),
  }),
}));

vi.mock("shared/components", () => ({
  Button: ({
    children,
    onClick,
    loading,
    disabled,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    loading?: boolean;
    disabled?: boolean;
    [key: string]: unknown;
  }) => (
    <button onClick={onClick} disabled={disabled || loading} {...props}>
      {loading ? "Loading..." : children}
    </button>
  ),
}));

describe("HubActions", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true });
  });

  it("renders Save to Review and Mark Learned buttons for authenticated users", () => {
    render(<HubActions character="好" />);

    expect(screen.getByText("💾 Save to Review")).toBeInTheDocument();
    expect(screen.getByText("✓ Mark Learned")).toBeInTheDocument();
  });

  it("hides the registered-only actions for guests (no fake success)", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false });
    const { container } = render(<HubActions character="好" />);

    expect(container.innerHTML).toBe("");
    expect(screen.queryByText("💾 Save to Review")).toBeNull();
    expect(screen.queryByText("✓ Mark Learned")).toBeNull();
  });
});
