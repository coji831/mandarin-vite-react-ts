/**
 * @file ClusterCard.test.tsx
 * @description Tests for the collapsible ClusterCard component
 * VisFix W6a: default collapsed, click/keyboard toggle, members hidden/shown,
 * HSK badges + pronunciation note visible in both states.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ClusterCard } from "./ClusterCard";
import type { PhoneticClusterDetail } from "../types";

// ─── Mock openHub (used by the member chips — shared Chip) ──────────
const mockOpenHub = vi.hoisted(() => vi.fn());
vi.mock("shared/store", () => ({
  openHub: mockOpenHub,
}));

// ─── Sample data ────────────────────────────────────────────────────
const sampleCluster: PhoneticClusterDetail = {
  id: "pc_0001",
  phoneticPattern: "青",
  pinyin: "qīng",
  description: "Characters containing 青",
  pronunciationNote: "All share qing- onset",
  memberCount: 2,
  hskLevels: [1, 2],
  members: [
    { glyph: "请", pinyin: "qǐng", meaning: "please", hskLevel: 1 },
    { glyph: "情", pinyin: "qíng", meaning: "feeling", hskLevel: 2 },
  ],
};

const toggleName = /Characters containing 青/;

describe("ClusterCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders collapsed by default — header info visible, members hidden", () => {
    render(<ClusterCard cluster={sampleCluster} />);

    // Header content (family glyph + pinyin + description + member-count chip)
    expect(screen.getByText("青")).toBeInTheDocument();
    expect(screen.getByText("qīng")).toBeInTheDocument();
    expect(screen.getByText("Characters containing 青")).toBeInTheDocument();
    expect(screen.getByText("2 members")).toBeInTheDocument();

    const toggle = screen.getByRole("button", { name: toggleName });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    // Member chips are hidden while collapsed
    expect(screen.queryByText("请")).not.toBeInTheDocument();
    expect(screen.queryByText("情")).not.toBeInTheDocument();
  });

  it("keeps the pronunciation note and HSK badges visible while collapsed", () => {
    render(<ClusterCard cluster={sampleCluster} />);

    // Pronunciation note
    expect(screen.getByText("All share qing- onset")).toBeInTheDocument();
    // HSK badges
    expect(screen.getByText("HSK 1")).toBeInTheDocument();
    expect(screen.getByText("HSK 2")).toBeInTheDocument();
  });

  it("expands to reveal member chips on click and updates aria-expanded", () => {
    render(<ClusterCard cluster={sampleCluster} />);
    const toggle = screen.getByRole("button", { name: toggleName });

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("请")).toBeInTheDocument();
    expect(screen.getByText("情")).toBeInTheDocument();
    // Member chips are the shared Chip component (interactive button)
    const memberChip = screen.getByLabelText("请 — qǐng — please");
    expect(memberChip).toHaveClass("chip");
    expect(memberChip.tagName).toBe("BUTTON");

    // Collapse again
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("请")).not.toBeInTheDocument();
  });

  it("toggles with the keyboard (Enter and Space)", () => {
    render(<ClusterCard cluster={sampleCluster} />);
    const toggle = screen.getByRole("button", { name: toggleName });

    fireEvent.keyDown(toggle, { key: "Enter" });
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    fireEvent.keyDown(toggle, { key: " " });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("opens the hub when a member chip is clicked while expanded", () => {
    render(<ClusterCard cluster={sampleCluster} />);
    fireEvent.click(screen.getByRole("button", { name: toggleName }));

    fireEvent.click(screen.getByLabelText("请 — qǐng — please"));
    expect(mockOpenHub).toHaveBeenCalledWith({
      entityType: "character",
      entityId: "请",
      label: "qǐng",
    });
  });
});
