/**
 * @file components/__tests__/PhoneticTreeView.test.tsx
 * @description Tests for PhoneticTreeView component
 * Story 21.19: Radical Trees — Phonetic Tree Toggle
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PhoneticTreeView } from "../PhoneticTreeView";

// Mock the service
const mockGetPhoneticFamilies = vi.hoisted(() => vi.fn());
vi.mock("../../services/phoneticTreeService", async () => {
  const actual = await vi.importActual("../../services/phoneticTreeService");
  return {
    ...actual,
    getPhoneticFamilies: mockGetPhoneticFamilies,
  };
});

// Mock child component
vi.mock("../PhoneticFamilyNode", () => ({
  PhoneticFamilyNode: vi.fn(({ family }: { family: { id: string; phoneticPattern: string } }) => (
    <div data-testid={`family-node-${family.id}`}>{family.phoneticPattern}</div>
  )),
}));

// Mock shared components
vi.mock("shared/components", () => ({
  Box: vi.fn(({ children, variant, padding, className }) => (
    <div data-testid={`mock-box-${variant}`} data-padding={padding} className={className}>
      {children}
    </div>
  )),
  Skeleton: vi.fn(({ variant, className }) => (
    <div data-testid="skeleton" data-variant={variant} className={className} />
  )),
  ErrorScreen: vi.fn(
    ({ error, onRetry, title }: { error: string; onRetry: () => void; title: string }) => (
      <div data-testid="mock-error-screen">
        <p>{title}</p>
        <p>{error}</p>
        <button onClick={onRetry} type="button">
          Retry
        </button>
      </div>
    ),
  ),
}));

const SAMPLE_FAMILIES = [
  {
    id: "pc_0001",
    phoneticPattern: "青",
    pinyin: "qīng",
    description: "blue/green",
    pronunciationNote: null,
    memberCount: 4,
    hskLevels: [2, 3],
    members: [
      { glyph: "清", pinyin: "qīng", meaning: "clear", hskLevel: 3, classification: null },
      { glyph: "情", pinyin: "qíng", meaning: "feeling", hskLevel: 2, classification: null },
    ],
  },
  {
    id: "pc_0002",
    phoneticPattern: "包",
    pinyin: "bāo",
    description: "wrap",
    pronunciationNote: null,
    memberCount: 3,
    hskLevels: [2],
    members: [
      { glyph: "跑", pinyin: "pǎo", meaning: "run", hskLevel: 2, classification: null },
      { glyph: "抱", pinyin: "bào", meaning: "hug", hskLevel: 3, classification: null },
    ],
  },
];

describe("PhoneticTreeView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Loading state ──

  it("renders loading state with skeleton", () => {
    mockGetPhoneticFamilies.mockReturnValue(new Promise(() => {})); // Never resolves
    render(<PhoneticTreeView isPhase3={false} />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Loading phonetic families…")).toBeInTheDocument();
    expect(screen.getByTestId("skeleton")).toBeInTheDocument();
  });

  // ── Error state with retry ──

  it("renders error state with retry button", async () => {
    mockGetPhoneticFamilies.mockRejectedValue(new Error("Network failure"));
    render(<PhoneticTreeView isPhase3={false} />);

    expect(await screen.findByTestId("mock-error-screen")).toBeInTheDocument();
    expect(screen.getByText("Failed to load phonetic families")).toBeInTheDocument();
    expect(screen.getByText("Network failure")).toBeInTheDocument();

    const retryButton = screen.getByText("Retry");
    expect(retryButton).toBeInTheDocument();
  });

  it("calls getPhoneticFamilies again on retry", async () => {
    mockGetPhoneticFamilies.mockRejectedValueOnce(new Error("Network failure"));
    mockGetPhoneticFamilies.mockResolvedValueOnce(SAMPLE_FAMILIES);

    render(<PhoneticTreeView isPhase3={false} />);

    // Wait for error, then retry
    const retryButton = await screen.findByText("Retry");
    fireEvent.click(retryButton);

    // After retry, families should render
    expect(await screen.findByTestId("family-node-pc_0001")).toBeInTheDocument();
    expect(mockGetPhoneticFamilies).toHaveBeenCalledTimes(2);
  });

  // ── Empty state ──

  it("renders empty state when no families returned", async () => {
    mockGetPhoneticFamilies.mockResolvedValue([]);
    render(<PhoneticTreeView isPhase3={false} />);

    expect(await screen.findByText("No phonetic families found.")).toBeInTheDocument();
    expect(screen.getByText("Phonetic cluster data may not be available yet.")).toBeInTheDocument();
  });

  // ── Phase 2 preview ──

  it("renders Phase 2 preview with top 10 families and locked banner", async () => {
    // Create 12 families to exceed the preview limit
    const manyFamilies = Array.from({ length: 12 }, (_, i) => ({
      ...SAMPLE_FAMILIES[0],
      id: `pc_${String(i + 1).padStart(4, "0")}`,
      phoneticPattern: `fam${i + 1}`,
      memberCount: 1,
    }));
    mockGetPhoneticFamilies.mockResolvedValue(manyFamilies);

    render(<PhoneticTreeView isPhase3={false} />);

    // Wait for data to load
    const banner = await screen.findByText(/Showing top 10 of 12 phonetic families/);
    expect(banner).toBeInTheDocument();

    // Should show 10 family nodes
    const nodes = screen.getAllByTestId(/^family-node-pc_/);
    expect(nodes).toHaveLength(10);
  });

  it("does not show locked banner when families <= preview count", async () => {
    mockGetPhoneticFamilies.mockResolvedValue(SAMPLE_FAMILIES); // 2 families
    render(<PhoneticTreeView isPhase3={false} />);

    await screen.findByTestId("family-node-pc_0001");

    expect(screen.queryByText(/Showing top 10 of/)).not.toBeInTheDocument();
  });

  // ── Phase 3 full view ──

  it("renders Phase 3 full view with all families and no locked banner", async () => {
    const manyFamilies = Array.from({ length: 15 }, (_, i) => ({
      ...SAMPLE_FAMILIES[0],
      id: `pc_${String(i + 1).padStart(4, "0")}`,
      phoneticPattern: `fam${i + 1}`,
      memberCount: 1,
    }));
    mockGetPhoneticFamilies.mockResolvedValue(manyFamilies);

    render(<PhoneticTreeView isPhase3={true} />);

    // Wait for data to load
    await screen.findByTestId("family-node-pc_0001");

    // Should show all 15 families
    const nodes = screen.getAllByTestId(/^family-node-pc_/);
    expect(nodes).toHaveLength(15);

    // No locked banner
    expect(screen.queryByText(/Showing top .* of/)).not.toBeInTheDocument();
  });

  // ── Phase 2 with no overflow ──

  it("renders Phase 2 when family count is under the limit", async () => {
    mockGetPhoneticFamilies.mockResolvedValue(SAMPLE_FAMILIES);
    render(<PhoneticTreeView isPhase3={false} />);

    expect(await screen.findByTestId("family-node-pc_0001")).toBeInTheDocument();
    expect(screen.getByTestId("family-node-pc_0002")).toBeInTheDocument();

    // No banner since count <= 10
    expect(screen.queryByText(/Showing top/)).not.toBeInTheDocument();
  });
});
