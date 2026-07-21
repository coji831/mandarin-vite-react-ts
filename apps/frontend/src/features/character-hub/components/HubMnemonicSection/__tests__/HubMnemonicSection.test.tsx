/**
 * @file HubMnemonicSection.test.tsx
 * @description Tests for HubMnemonicSection component
 * Story 20.2: Mnemonic Display UI
 *
 * Tests: phase gate, loading, empty, display, editing, error, timeout, pictograph states.
 */

import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Use vi.hoisted for variables that vi.mock factories reference
const { mockGetMnemonic, mockUsePhaseGate } = vi.hoisted(() => ({
  mockGetMnemonic: vi.fn(),
  mockUsePhaseGate: vi.fn(),
}));

vi.mock("../../../services", () => ({
  getMnemonic: mockGetMnemonic,
  generateMnemonic: vi.fn(),
  updateMnemonic: vi.fn(),
  deleteMnemonic: vi.fn(),
}));

vi.mock("../../../constants", () => ({
  PICTOGRAPH_CHARS: new Set(["人", "大", "小", "口", "目", "山", "水", "火", "日", "月"]),
}));

vi.mock("shared/hooks", () => ({
  usePhaseGate: () => mockUsePhaseGate(),
}));

vi.mock("shared/components", () => ({
  Button: ({
    children,
    onClick,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    [key: string]: unknown;
  }) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
  Spinner: ({ size }: { size?: string }) => (
    <div data-testid="spinner" data-size={size}>
      Spinner
    </div>
  ),
  Textarea: ({
    value,
    onChange,
    ...props
  }: {
    value: string;
    onChange: (v: string) => void;
    [key: string]: unknown;
  }) => <textarea value={value} onChange={(e) => onChange(e.target.value)} {...props} />,
  Modal: ({
    isOpen,
    title,
    children,
    footer,
    onClose,
  }: {
    isOpen: boolean;
    title?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    onClose?: () => void;
  }) =>
    isOpen ? (
      <div data-testid="modal" role="dialog">
        <h2>{title}</h2>
        <div>{children}</div>
        {footer && <div data-testid="modal-footer">{footer}</div>}
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

import { HubMnemonicSection } from "../../HubMnemonicSection/HubMnemonicSection";
import type { MnemonicResponse } from "../../../services";

const SAMPLE_STORY = "A woman with a child is good.";
const SAMPLE_RESPONSE: MnemonicResponse = {
  id: "mne_001",
  characterGlyph: "好",
  story: SAMPLE_STORY,
  radicalIds: [],
  isEdited: false,
  isPictograph: false,
  createdAt: "",
  updatedAt: "",
};

describe("HubMnemonicSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePhaseGate.mockReturnValue({ phaseGate: { currentPhase: 3 } });
  });

  // ── Phase Gate ──────────────────────────────────────

  it("renders nothing when phase < 2", () => {
    mockUsePhaseGate.mockReturnValue({ phaseGate: { currentPhase: 1 } });
    const { container } = render(<HubMnemonicSection character="好" />);
    expect(container.innerHTML).toBe("");
  });

  it("renders section when phase >= 2", () => {
    mockUsePhaseGate.mockReturnValue({ phaseGate: { currentPhase: 2 } });
    render(<HubMnemonicSection character="好" />);
    // Should show loading state initially
    expect(screen.getByRole("status")).toBeTruthy();
  });

  // ── Loading State ───────────────────────────────────

  it("loading state renders with role='status'", () => {
    mockGetMnemonic.mockReturnValue(new Promise(() => {})); // Never resolves
    render(<HubMnemonicSection character="好" />);
    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.getByText("Loading story…")).toBeTruthy();
  });

  // ── Empty State ─────────────────────────────────────

  it("empty state shows '✨ Generate Story' button", async () => {
    mockGetMnemonic.mockResolvedValue(null);
    render(<HubMnemonicSection character="好" />);

    // Wait for the async effect to complete and re-render
    await waitFor(() => {
      expect(mockGetMnemonic).toHaveBeenCalledWith("好");
    });

    await waitFor(() => {
      expect(screen.getByText("✨ Generate Story")).toBeTruthy();
    });
  });

  // ── Display State ───────────────────────────────────

  it("display state shows story text and action buttons", async () => {
    mockGetMnemonic.mockResolvedValue(SAMPLE_RESPONSE);
    render(<HubMnemonicSection character="好" />);

    await waitFor(() => {
      expect(screen.getByText(SAMPLE_STORY)).toBeTruthy();
    });

    expect(screen.getByLabelText("Edit mnemonic story")).toBeTruthy();
    expect(screen.getByLabelText("Regenerate mnemonic story")).toBeTruthy();
  });

  // ── Editing State ───────────────────────────────────

  it("editing state shows Textarea with Save/Cancel", async () => {
    mockGetMnemonic.mockResolvedValue(SAMPLE_RESPONSE);
    render(<HubMnemonicSection character="好" />);

    await waitFor(() => {
      expect(screen.getByText(SAMPLE_STORY)).toBeTruthy();
    });

    fireEvent.click(screen.getByLabelText("Edit mnemonic story"));

    await waitFor(() => {
      expect(screen.getByLabelText("Mnemonic story editor")).toBeTruthy();
    });
    expect(screen.getByText("💾 Save")).toBeTruthy();
    expect(screen.getByText("✖ Cancel")).toBeTruthy();
  });

  // ── Error State ─────────────────────────────────────

  it("error state shows message and Retry", async () => {
    mockGetMnemonic.mockRejectedValue(new Error("Failed to load"));
    render(<HubMnemonicSection character="好" />);

    await waitFor(() => {
      expect(screen.getByText("Retry")).toBeTruthy();
    });
    expect(screen.getByText("Failed to load mnemonic story.")).toBeTruthy();
  });

  // ── Pictograph State ────────────────────────────────

  it("pictograph state shows info message", () => {
    render(<HubMnemonicSection character="人" />);

    expect(screen.getByText(/This character.*is a simple pictograph/)).toBeTruthy();
  });
});
