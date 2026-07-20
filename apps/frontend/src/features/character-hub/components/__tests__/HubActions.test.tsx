/**
 * @file HubActions.test.tsx
 * @description Tests for HubActions component
 * Story 18.5: Character Detail Hub (Phase 1 Minimal)
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { HubActions } from "../HubActions";

// Mock the services barrel (provides PICTOGRAPH_CHARS)
vi.mock("../../services", () => ({
  PICTOGRAPH_CHARS: new Set([
    "人",
    "大",
    "小",
    "口",
    "目",
    "山",
    "水",
    "火",
    "日",
    "月",
    "木",
    "田",
    "土",
    "石",
    "雨",
    "云",
    "牛",
    "马",
    "羊",
    "鸟",
    "鱼",
    "龙",
    "虎",
    "鹿",
    "象",
    "龟",
    "虫",
    "贝",
    "网",
    "车",
  ]),
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
  it("renders Save to Review and Mark Learned buttons", () => {
    render(<HubActions character="好" />);

    expect(screen.getByText("💾 Save to Review")).toBeInTheDocument();
    expect(screen.getByText("✓ Mark Learned")).toBeInTheDocument();
  });

  it("renders 'View Story' button", () => {
    render(<HubActions character="好" />);

    expect(screen.getByText("📖 View Story")).toBeInTheDocument();
  });

  it("calls onOpenMnemonic prop when View Story is clicked", () => {
    const onOpenMnemonic = vi.fn();
    render(<HubActions character="好" onOpenMnemonic={onOpenMnemonic} />);

    screen.getByText("📖 View Story").click();
    expect(onOpenMnemonic).toHaveBeenCalledTimes(1);
  });

  it("has aria-disabled for pictograph characters", () => {
    render(<HubActions character="水" />);

    const button = screen.getByText("📖 View Story");
    expect(button.getAttribute("aria-disabled")).toBe("true");
  });

  it("has correct title for pictograph characters", () => {
    render(<HubActions character="水" />);

    const button = screen.getByText("📖 View Story");
    expect(button.getAttribute("title")).toBe("This character is a simple pictograph");
  });
});
