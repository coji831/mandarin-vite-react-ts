/**
 * @file __tests__/PhoneticClustersContent.test.tsx
 * @description Component tests for PhoneticClustersContent
 * Story 21.6: Phonetic Clusters
 *
 * Covers: loading, error, empty, filtered-empty, populated, filter chip click, character chip click.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PhoneticClustersContent } from "../components/PhoneticClustersContent";
import type { PhoneticClusterDetail } from "../types";

// ─── Mock openHub ───────────────────────────────────────────────────
const mockOpenHub = vi.hoisted(() => vi.fn());
vi.mock("shared/store", () => ({
  openHub: mockOpenHub,
}));

// ─── Sample data ────────────────────────────────────────────────────
const sampleClusters: PhoneticClusterDetail[] = [
  {
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
  },
  {
    id: "pc_0002",
    phoneticPattern: "包",
    pinyin: "bāo",
    description: "Characters containing 包",
    pronunciationNote: null,
    memberCount: 1,
    hskLevels: [2],
    members: [{ glyph: "抱", pinyin: "bào", meaning: "hug", hskLevel: 2 }],
  },
];

const defaultProps = {
  clusters: [] as PhoneticClusterDetail[],
  isLoading: false,
  error: null as string | null,
  hskFilter: null as number | null,
  onHskFilterChange: vi.fn(),
  onRetry: vi.fn(),
};

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("PhoneticClustersContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Loading State ──────────────────────────────────────────────────
  it("renders loading skeleton when isLoading is true", () => {
    renderWithRouter(<PhoneticClustersContent {...defaultProps} isLoading={true} />);
    // Should show skeleton elements (skeleton-loading class)
    const skeletons = document.querySelectorAll(".skeleton-loading");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  // ─── Error State ────────────────────────────────────────────────────
  it("renders error screen with retry button", () => {
    const onRetry = vi.fn();
    renderWithRouter(
      <PhoneticClustersContent
        {...defaultProps}
        error="Failed to load clusters"
        onRetry={onRetry}
      />,
    );
    // Error text appears in both title (h2) and message (p) — check heading specifically
    expect(screen.getByRole("heading", { name: "Failed to load clusters" })).toBeInTheDocument();
    expect(screen.getByText("Try Again")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Try Again"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  // ─── Empty State ────────────────────────────────────────────────────
  it("renders empty state message when no clusters and no filter", () => {
    renderWithRouter(<PhoneticClustersContent {...defaultProps} clusters={[]} hskFilter={null} />);
    expect(screen.getByText("No phonetic clusters available yet")).toBeInTheDocument();
  });

  // ─── Filtered-Empty State ───────────────────────────────────────────
  it("renders filtered-empty state with Show All button", () => {
    const onHskFilterChange = vi.fn();
    renderWithRouter(
      <PhoneticClustersContent
        {...defaultProps}
        clusters={[]}
        hskFilter={6}
        onHskFilterChange={onHskFilterChange}
      />,
    );
    expect(screen.getByText("No clusters for HSK 6")).toBeInTheDocument();
    expect(screen.getByText("Show all")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Show all"));
    expect(onHskFilterChange).toHaveBeenCalledWith(null);
  });

  // ─── Populated State ────────────────────────────────────────────────
  it("renders cluster cards when data is provided", () => {
    renderWithRouter(<PhoneticClustersContent {...defaultProps} clusters={sampleClusters} />);
    expect(screen.getByText("青")).toBeInTheDocument();
    expect(screen.getByText("包")).toBeInTheDocument();
    expect(screen.getByText("Characters containing 青")).toBeInTheDocument();
    expect(screen.getByText("Characters containing 包")).toBeInTheDocument();
  });

  // ─── HSK Filter Chips ──────────────────────────────────────────────
  it("renders HSK filter chips and highlights selected one", () => {
    renderWithRouter(
      <PhoneticClustersContent {...defaultProps} clusters={sampleClusters} hskFilter={2} />,
    );
    // Use getByRole to target the filter chip button specifically (not cluster card badges)
    const hsk2Chip = screen.getByRole("button", { name: "HSK 2" });
    expect(hsk2Chip).toHaveAttribute("aria-pressed", "true");
  });

  it("calls onHskFilterChange when a filter chip is clicked", () => {
    const onHskFilterChange = vi.fn();
    renderWithRouter(
      <PhoneticClustersContent
        {...defaultProps}
        clusters={sampleClusters}
        hskFilter={null}
        onHskFilterChange={onHskFilterChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "HSK 1" }));
    expect(onHskFilterChange).toHaveBeenCalledWith(1);
  });

  // ─── Character Chip Click ──────────────────────────────────────────
  it("calls openHub when a character chip is clicked", () => {
    renderWithRouter(<PhoneticClustersContent {...defaultProps} clusters={sampleClusters} />);
    const chip = screen.getByLabelText("请 — qǐng — please");
    fireEvent.click(chip);
    expect(mockOpenHub).toHaveBeenCalledWith({
      entityType: "character",
      entityId: "请",
      label: "qǐng",
    });
  });

  // ─── Pronunciation Note ─────────────────────────────────────────────
  it("renders pronunciation note when present", () => {
    renderWithRouter(<PhoneticClustersContent {...defaultProps} clusters={sampleClusters} />);
    expect(screen.getByText("All share qing- onset")).toBeInTheDocument();
  });

  it("does not render pronunciation note when absent", () => {
    renderWithRouter(<PhoneticClustersContent {...defaultProps} clusters={[sampleClusters[1]]} />);
    expect(screen.queryByLabelText("Pronunciation note")).not.toBeInTheDocument();
  });
});
