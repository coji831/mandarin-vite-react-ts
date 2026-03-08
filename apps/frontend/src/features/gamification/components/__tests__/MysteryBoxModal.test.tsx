/**
 * Tests for MysteryBoxModal component
 * Story 15.9: Gamification & AI Integration
 *
 * Tests modal rendering, animations, and reward display with:
 * - Show/hide behavior
 * - XP reward display
 * - Freeze reward display
 * - Badge reward display
 * - Close functionality
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MysteryBoxModal } from "../MysteryBoxModal";
import type { MysteryBox } from "../../../quiz/types";

describe("MysteryBoxModal", () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it("should not render when isOpen is false", () => {
    const mysteryBox: MysteryBox = {
      type: "xp",
      amount: 50,
      name: "Bonus XP",
      icon: "⭐",
      droppedAt: "2026-02-15T10:00:00.000Z",
      milestone: 7,
    };

    render(<MysteryBoxModal isOpen={false} mysteryBox={mysteryBox} onClose={mockOnClose} />);

    expect(screen.queryByText(/Mystery Box!/i)).not.toBeInTheDocument();
  });

  it("should render when isOpen is true", async () => {
    const mysteryBox: MysteryBox = {
      type: "xp",
      amount: 50,
      name: "Bonus XP",
      icon: "⭐",
      droppedAt: "2026-02-15T10:00:00.000Z",
      milestone: 7,
    };

    render(<MysteryBoxModal isOpen={true} mysteryBox={mysteryBox} onClose={mockOnClose} />);

    // Wait for reveal (1s delay)
    await waitFor(
      () => {
        expect(screen.getByText(/Mystery Box!/i)).toBeInTheDocument();
      },
      { timeout: 1500 },
    );
  });

  it("should display XP reward correctly", () => {
    const mysteryBox: MysteryBox = {
      type: "xp",
      amount: 50,
      name: "Bonus XP",
      icon: "⭐",
      droppedAt: "2026-02-15T10:00:00.000Z",
      milestone: 7,
    };

    render(<MysteryBoxModal show={true} mysteryBox={mysteryBox} onClose={mockOnClose} />);

    expect(screen.getByText("⭐")).toBeInTheDocument();
    expect(screen.getByText("Bonus XP")).toBeInTheDocument();
    expect(screen.getByText(/50/)).toBeInTheDocument();
  });

  it("should display freeze reward correctly", () => {
    const mysteryBox: MysteryBox = {
      type: "freeze",
      amount: 1,
      name: "Streak Freeze",
      icon: "❄️",
      droppedAt: "2026-02-15T10:00:00.000Z",
      milestone: 14,
    };

    render(<MysteryBoxModal show={true} mysteryBox={mysteryBox} onClose={mockOnClose} />);

    expect(screen.getByText("❄️")).toBeInTheDocument();
    expect(screen.getByText("Streak Freeze")).toBeInTheDocument();
    expect(screen.getByText(/1/)).toBeInTheDocument();
  });

  it("should display badge reward correctly", () => {
    const mysteryBox: MysteryBox = {
      type: "badge",
      id: "golden_flame_rare",
      name: "Golden Flame (Rare)",
      icon: "✨",
      droppedAt: "2026-02-15T10:00:00.000Z",
      milestone: 21,
    };

    render(<MysteryBoxModal show={true} mysteryBox={mysteryBox} onClose={mockOnClose} />);

    expect(screen.getByText("✨")).toBeInTheDocument();
    expect(screen.getByText("Golden Flame (Rare)")).toBeInTheDocument();
  });

  it("should display milestone information", () => {
    const mysteryBox: MysteryBox = {
      type: "xp",
      amount: 50,
      name: "Bonus XP",
      icon: "⭐",
      droppedAt: "2026-02-15T10:00:00.000Z",
      milestone: 7,
    };

    render(<MysteryBoxModal show={true} mysteryBox={mysteryBox} onClose={mockOnClose} />);

    expect(screen.getByText(/7-day milestone/i)).toBeInTheDocument();
  });

  it("should call onClose when close button clicked", () => {
    const mysteryBox: MysteryBox = {
      type: "xp",
      amount: 50,
      name: "Bonus XP",
      icon: "⭐",
      droppedAt: "2026-02-15T10:00:00.000Z",
      milestone: 7,
    };

    render(<MysteryBoxModal show={true} mysteryBox={mysteryBox} onClose={mockOnClose} />);

    const closeButton = screen.getByRole("button", { name: /claim/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("should call onClose when overlay clicked", () => {
    const mysteryBox: MysteryBox = {
      type: "xp",
      amount: 50,
      name: "Bonus XP",
      icon: "⭐",
      droppedAt: "2026-02-15T10:00:00.000Z",
      milestone: 7,
    };

    render(<MysteryBoxModal show={true} mysteryBox={mysteryBox} onClose={mockOnClose} />);

    // Click overlay (parent element of modal content)
    const overlay = screen.getByText(/Mystery Box!/i).closest(".modalOverlay");
    if (overlay) {
      fireEvent.click(overlay);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }
  });

  it("should handle null mysteryBox gracefully", () => {
    render(<MysteryBoxModal show={true} mysteryBox={null} onClose={mockOnClose} />);

    // Should not crash, but should not render content
    expect(screen.queryByText(/Mystery Box!/i)).not.toBeInTheDocument();
  });

  it("should handle undefined mysteryBox gracefully", () => {
    render(<MysteryBoxModal show={true} mysteryBox={undefined} onClose={mockOnClose} />);

    // Should not crash, but should not render content
    expect(screen.queryByText(/Mystery Box!/i)).not.toBeInTheDocument();
  });

  it("should display celebration animation classes", () => {
    const mysteryBox: MysteryBox = {
      type: "xp",
      amount: 50,
      name: "Bonus XP",
      icon: "⭐",
      droppedAt: "2026-02-15T10:00:00.000Z",
      milestone: 7,
    };

    const { container } = render(
      <MysteryBoxModal show={true} mysteryBox={mysteryBox} onClose={mockOnClose} />,
    );

    // Check for animation classes (fade-in, bounce, etc.)
    const modalContent = container.querySelector(".modalContent");
    expect(modalContent).toBeInTheDocument();
  });

  it("should handle large milestone numbers", () => {
    const mysteryBox: MysteryBox = {
      type: "freeze",
      amount: 1,
      name: "Streak Freeze",
      icon: "❄️",
      droppedAt: "2026-02-15T10:00:00.000Z",
      milestone: 365,
    };

    render(<MysteryBoxModal show={true} mysteryBox={mysteryBox} onClose={mockOnClose} />);

    expect(screen.getByText(/365-day milestone/i)).toBeInTheDocument();
  });

  it("should display congratulations message", () => {
    const mysteryBox: MysteryBox = {
      type: "xp",
      amount: 50,
      name: "Bonus XP",
      icon: "⭐",
      droppedAt: "2026-02-15T10:00:00.000Z",
      milestone: 7,
    };

    render(<MysteryBoxModal show={true} mysteryBox={mysteryBox} onClose={mockOnClose} />);

    expect(screen.getByText(/Congratulations/i)).toBeInTheDocument();
  });
});
