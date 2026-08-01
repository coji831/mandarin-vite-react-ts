/**
 * @file components/__tests__/PhoneticFamilyNode.test.tsx
 * @description Tests for PhoneticFamilyNode component
 * Story 21.19: Radical Trees — Phonetic Tree Toggle
 */

import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PhoneticFamilyNode } from "../PhoneticFamilyNode";
import * as phoneticTreeService from "../../services/phoneticTreeService";
import type { PhoneticFamily } from "../../services/phoneticTreeService";

// Mock openHub
const mockOpenHub = vi.hoisted(() => vi.fn());
vi.mock("shared/store", async () => {
  const actual = await vi.importActual("shared/store");
  return { ...actual, openHub: mockOpenHub };
});

// Mock shared components
vi.mock("shared/components", () => ({
  Box: vi.fn(({ children, variant, padding, className }) => (
    <div data-testid={`mock-box-${variant}`} data-padding={padding} className={className}>
      {children}
    </div>
  )),
  Button: vi.fn(({ children, onClick, className, "aria-label": ariaLabel, title }) => (
    <button
      data-testid="mock-button"
      onClick={onClick}
      className={className}
      aria-label={ariaLabel}
      title={title}
      type="button"
    >
      {children}
    </button>
  )),
  ClassificationBadge: vi.fn(({ classification, size, showLabel }) => (
    <span
      data-testid="classification-badge"
      data-classification={classification}
      data-size={size}
      data-show-label={showLabel}
    >
      {classification}
    </span>
  )),
}));

const SAMPLE_FAMILY: PhoneticFamily = {
  id: "pc_0001",
  phoneticPattern: "青",
  pinyin: "qīng",
  description: "blue/green",
  pronunciationNote: null,
  memberCount: 3,
  hskLevels: [2, 3],
  members: [
    { glyph: "清", pinyin: "qīng", meaning: "clear", hskLevel: 3, classification: null },
    { glyph: "情", pinyin: "qíng", meaning: "feeling", hskLevel: 2, classification: null },
  ],
};

const SAMPLE_ENRICHED_FAMILY: PhoneticFamily = {
  ...SAMPLE_FAMILY,
  members: [
    {
      glyph: "清",
      pinyin: "qīng",
      meaning: "clear",
      hskLevel: 3,
      classification: "phono_semantic",
    },
    {
      glyph: "情",
      pinyin: "qíng",
      meaning: "feeling",
      hskLevel: 2,
      classification: "phono_semantic",
    },
  ],
};

describe("PhoneticFamilyNode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Header / collapsed state ──

  it("renders family header with glyph, pinyin, and count", () => {
    render(<PhoneticFamilyNode family={SAMPLE_FAMILY} />);

    expect(screen.getByText("青")).toBeInTheDocument();
    expect(screen.getByText("qīng")).toBeInTheDocument();
    expect(screen.getByText("— blue/green")).toBeInTheDocument();
    expect(screen.getByText("3 characters")).toBeInTheDocument();
  });

  it("has correct aria attributes on header", () => {
    render(<PhoneticFamilyNode family={SAMPLE_FAMILY} />);

    const header = screen.getByRole("button", {
      name: /青.*qīng.*blue\/green.*3 characters/,
    });
    expect(header).toHaveAttribute("aria-expanded", "false");
    expect(header).toHaveAttribute("tabIndex", "0");
  });

  it("does not show members when collapsed", () => {
    render(<PhoneticFamilyNode family={SAMPLE_FAMILY} />);

    expect(screen.queryByText("清")).not.toBeInTheDocument();
    expect(screen.queryByText("情")).not.toBeInTheDocument();
  });

  // ── Expand / collapse ──

  it("expands to show members on click", async () => {
    render(<PhoneticFamilyNode family={SAMPLE_FAMILY} />);

    const header = screen.getByRole("button", {
      name: /青.*qīng.*blue\/green.*3 characters/,
    });
    fireEvent.click(header);

    // Members should now be visible
    expect(screen.getByText("清")).toBeInTheDocument();
    expect(screen.getByText("情")).toBeInTheDocument();
    expect(screen.getByText("qíng")).toBeInTheDocument(); // pinyin of second member
    expect(screen.getByText("clear")).toBeInTheDocument();
    expect(screen.getByText("feeling")).toBeInTheDocument();

    // Header should reflect expanded state
    expect(header).toHaveAttribute("aria-expanded", "true");
  });

  it("collapses on second click", () => {
    render(<PhoneticFamilyNode family={SAMPLE_FAMILY} />);

    const header = screen.getByRole("button", {
      name: /青.*qīng.*blue\/green.*3 characters/,
    });

    // Expand
    fireEvent.click(header);
    expect(screen.getByText("清")).toBeInTheDocument();

    // Collapse
    fireEvent.click(header);
    expect(screen.queryByText("清")).not.toBeInTheDocument();
  });

  it("toggles on Enter key", () => {
    render(<PhoneticFamilyNode family={SAMPLE_FAMILY} />);

    const header = screen.getByRole("button", {
      name: /青.*qīng.*blue\/green.*3 characters/,
    });

    fireEvent.keyDown(header, { key: "Enter" });
    expect(screen.getByText("清")).toBeInTheDocument();

    fireEvent.keyDown(header, { key: "Enter" });
    expect(screen.queryByText("清")).not.toBeInTheDocument();
  });

  it("toggles on Space key", () => {
    render(<PhoneticFamilyNode family={SAMPLE_FAMILY} />);

    const header = screen.getByRole("button", {
      name: /青.*qīng.*blue\/green.*3 characters/,
    });

    fireEvent.keyDown(header, { key: " " });
    expect(screen.getByText("清")).toBeInTheDocument();
  });

  // ── Enrichment on expand ──

  it("calls enrichFamilyMembers when expanded for the first time", async () => {
    const enrichSpy = vi
      .spyOn(phoneticTreeService, "enrichFamilyMembers")
      .mockResolvedValue(SAMPLE_ENRICHED_FAMILY);
    render(<PhoneticFamilyNode family={SAMPLE_FAMILY} />);

    const header = screen.getByRole("button", {
      name: /青.*qīng.*blue\/green.*3 characters/,
    });
    fireEvent.click(header);

    await waitFor(() => {
      expect(enrichSpy).toHaveBeenCalledWith(SAMPLE_FAMILY);
    });

    // Assert the DISPLAY output, not just the fetch: after async enrichment
    // resolves, the ClassificationBadge must actually render. Regression: the
    // members render mapped over raw `family.members` (classification null), so
    // badges never appeared after real enrichment.
    await waitFor(() => {
      expect(screen.getAllByTestId("classification-badge")).toHaveLength(2);
    });
    const badges = screen.getAllByTestId("classification-badge");
    expect(badges[0]).toHaveAttribute("data-classification", "phono_semantic");
  });

  it("shows classification badges when family has classification data", () => {
    // Pre-enriched family (classification already populated — no async needed)
    const preEnrichedFamily: PhoneticFamily = {
      ...SAMPLE_FAMILY,
      members: SAMPLE_FAMILY.members.map((m) => ({
        ...m,
        classification: "phono_semantic",
      })),
    };

    render(<PhoneticFamilyNode family={preEnrichedFamily} />);

    const header = screen.getByRole("button", {
      name: /青.*qīng.*blue\/green.*3 characters/,
    });
    fireEvent.click(header);

    const badges = screen.getAllByTestId("classification-badge");
    expect(badges).toHaveLength(2);
    expect(badges[0]).toHaveAttribute("data-classification", "phono_semantic");
  });

  // ── Single character count ──

  it("renders '1 character' for singular", () => {
    const singleMemberFamily: PhoneticFamily = {
      ...SAMPLE_FAMILY,
      memberCount: 1,
      members: [
        { glyph: "清", pinyin: "qīng", meaning: "clear", hskLevel: 3, classification: null },
      ],
    };

    render(<PhoneticFamilyNode family={singleMemberFamily} />);
    expect(screen.getByText("1 character")).toBeInTheDocument();
  });

  // ── Empty members fallback ──

  it("renders '(no members)' when family has no members", () => {
    const emptyFamily: PhoneticFamily = {
      ...SAMPLE_FAMILY,
      memberCount: 0,
      members: [],
    };

    render(<PhoneticFamilyNode family={emptyFamily} />);

    const header = screen.getByRole("button", {
      name: /青.*qīng.*blue\/green.*0 characters/,
    });
    fireEvent.click(header);

    expect(screen.getByText("(no members)")).toBeInTheDocument();
  });

  // ── Hub interaction ──

  it("calls openHub when a member is clicked", () => {
    render(<PhoneticFamilyNode family={SAMPLE_FAMILY} />);

    const header = screen.getByRole("button", {
      name: /青.*qīng.*blue\/green.*3 characters/,
    });
    fireEvent.click(header);

    const memberButton = screen.getByRole("button", { name: /清.*qīng.*clear/ });
    fireEvent.click(memberButton);

    expect(mockOpenHub).toHaveBeenCalledWith({
      entityType: "character",
      entityId: "清",
      label: "qīng",
    });
  });

  it("calls openHub when Hub button is clicked", () => {
    render(<PhoneticFamilyNode family={SAMPLE_FAMILY} />);

    const header = screen.getByRole("button", {
      name: /青.*qīng.*blue\/green.*3 characters/,
    });
    fireEvent.click(header);

    const hubButton = screen.getByRole("button", { name: /Open 清 in Character Detail Hub/ });
    fireEvent.click(hubButton);

    expect(mockOpenHub).toHaveBeenCalledWith({
      entityType: "character",
      entityId: "清",
      label: "qīng",
    });
  });

  // ── Enrichment failure — graceful degradation ──

  it("still renders members when enrichment fails (graceful degradation)", async () => {
    vi.spyOn(phoneticTreeService, "enrichFamilyMembers").mockRejectedValue(new Error("API error"));

    render(<PhoneticFamilyNode family={SAMPLE_FAMILY} />);

    const header = screen.getByRole("button", {
      name: /青.*qīng.*blue\/green.*3 characters/,
    });

    await act(async () => {
      fireEvent.click(header);
    });

    // Members should still render even without enrichment
    await waitFor(() => {
      expect(screen.getByText("清")).toBeInTheDocument();
    });
  });
});
