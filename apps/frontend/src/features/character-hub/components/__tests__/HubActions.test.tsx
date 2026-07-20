/**
 * @file HubActions.test.tsx
 * @description Tests for HubActions component
 * Story 18.5: Character Detail Hub (Phase 1 Minimal)
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { HubActions } from "../HubActions";

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
  it("renders Save to Review and Mark Learned buttons", () => {
    render(<HubActions character="好" />);

    expect(screen.getByText("💾 Save to Review")).toBeInTheDocument();
    expect(screen.getByText("✓ Mark Learned")).toBeInTheDocument();
  });
});
