/**
 * @file components/BranchNode.test.tsx
 * @description Tests for BranchNode component
 * Story 19.4: Radical Trees (Phase 3)
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BranchNode } from "./BranchNode";

const mockOpenHub = vi.fn();
vi.mock("shared/hooks", () => ({
  useCharacterHub: () => ({
    openHub: mockOpenHub,
  }),
}));

describe("BranchNode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders character glyph, pinyin, and meaning in horizontal layout", () => {
    render(<BranchNode character="水" pinyin="shuǐ" meaning="water" />);

    expect(screen.getByText("水")).toBeInTheDocument();
    expect(screen.getByText("shuǐ")).toBeInTheDocument();
    expect(screen.getByText("water")).toBeInTheDocument();
    // Separator between pinyin and meaning
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders audio and Hub buttons", () => {
    render(<BranchNode character="水" pinyin="shuǐ" meaning="water" />);

    // Audio button
    expect(screen.getByRole("button", { name: /play pronunciation for 水/i })).toBeInTheDocument();
    // Hub button
    expect(
      screen.getByRole("button", { name: /open 水 in character detail hub/i }),
    ).toBeInTheDocument();
  });

  it("calls openHub when character glyph section is clicked", () => {
    render(<BranchNode character="水" pinyin="shuǐ" meaning="water" />);

    fireEvent.click(screen.getByRole("button", { name: "水 — shuǐ — water" }));
    expect(mockOpenHub).toHaveBeenCalledWith("水", "shuǐ");
  });

  it("calls openHub on Enter key", () => {
    render(<BranchNode character="水" pinyin="shuǐ" meaning="water" />);

    fireEvent.keyDown(screen.getByRole("button", { name: "水 — shuǐ — water" }), {
      key: "Enter",
    });
    expect(mockOpenHub).toHaveBeenCalledWith("水", "shuǐ");
  });

  it("calls openHub on Space key", () => {
    render(<BranchNode character="水" pinyin="shuǐ" meaning="water" />);

    fireEvent.keyDown(screen.getByRole("button", { name: "水 — shuǐ — water" }), {
      key: " ",
    });
    expect(mockOpenHub).toHaveBeenCalledWith("水", "shuǐ");
  });

  it("has correct aria-label on character section", () => {
    render(<BranchNode character="水" pinyin="shuǐ" meaning="water" />);

    expect(screen.getByRole("button", { name: "水 — shuǐ — water" })).toBeInTheDocument();
  });

  it("calls openHub when Hub button is clicked", () => {
    render(<BranchNode character="水" pinyin="shuǐ" meaning="water" />);

    fireEvent.click(screen.getByRole("button", { name: /open 水 in character detail hub/i }));
    expect(mockOpenHub).toHaveBeenCalledWith("水", "shuǐ");
  });

  it("renders with connector class when showConnector is true", () => {
    const { container } = render(
      <BranchNode character="水" pinyin="shuǐ" meaning="water" showConnector={true} />,
    );

    expect(container.firstChild).toHaveClass("branch-node--with-connector");
  });

  it("renders without connector class by default", () => {
    const { container } = render(<BranchNode character="水" pinyin="shuǐ" meaning="water" />);

    expect(container.firstChild).not.toHaveClass("branch-node--with-connector");
  });

  it("does not call openHub when audio button is clicked (stops propagation)", () => {
    render(<BranchNode character="水" pinyin="shuǐ" meaning="water" />);

    const audioBtn = screen.getByRole("button", { name: /play pronunciation for 水/i });
    fireEvent.click(audioBtn);
    // openHub should not have been called by audio button click
    expect(mockOpenHub).not.toHaveBeenCalled();
  });
});
