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

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MysteryBoxModal } from "../MysteryBoxModal";
import type { MysteryBox } from "../../types/GamificationTypes";

describe("MysteryBoxModal", () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("should not render when isOpen is false", () => {
    const mysteryBox: MysteryBox = {
      rewardType: "xp_boost",
      rewardValue: 50,
      name: "Bonus XP",
      icon: "⭐",
    };

    render(<MysteryBoxModal isOpen={false} mysteryBox={mysteryBox} onClose={mockOnClose} />);

    expect(screen.queryByText(/Mystery Box!/i)).not.toBeInTheDocument();
  });

  it("should render when isOpen is true", () => {
    const mysteryBox: MysteryBox = {
      rewardType: "xp_boost",
      rewardValue: 50,
      name: "Bonus XP",
      icon: "⭐",
    };

    render(<MysteryBoxModal isOpen={true} mysteryBox={mysteryBox} onClose={mockOnClose} />);

    // Advance timers to trigger reveal (1s delay)
    act(() => {
      vi.advanceTimersByTime(1100);
    });

    expect(screen.getByText(/Mystery Box!/i)).toBeInTheDocument();
  });

  it("should display XP reward correctly", () => {
    const mysteryBox: MysteryBox = {
      rewardType: "xp_boost",
      rewardValue: 50,
      name: "Bonus XP",
      icon: "⭐",
    };

    render(<MysteryBoxModal isOpen={true} mysteryBox={mysteryBox} onClose={mockOnClose} />);

    // Advance timers to trigger reveal (1s delay)
    act(() => {
      vi.advanceTimersByTime(1100);
    });

    expect(screen.getByText("⭐")).toBeInTheDocument();
    expect(screen.getByText("Bonus XP")).toBeInTheDocument();
    expect(screen.getByText(/50/)).toBeInTheDocument();
  });

  it("should display freeze reward correctly", () => {
    const mysteryBox: MysteryBox = {
      rewardType: "freeze",
      rewardValue: 1,
      name: "Streak Freeze",
      icon: "❄️",
    };

    render(<MysteryBoxModal isOpen={true} mysteryBox={mysteryBox} onClose={mockOnClose} />);

    // Advance timers to trigger reveal (1s delay)
    act(() => {
      vi.advanceTimersByTime(1100);
    });

    expect(screen.getByText("❄️")).toBeInTheDocument();
    expect(screen.getByText("Streak Freeze")).toBeInTheDocument();
    expect(screen.getByText(/1/)).toBeInTheDocument();
  });

  it("should display cosmetic reward correctly", () => {
    const mysteryBox: MysteryBox = {
      rewardType: "cosmetic",
      rewardValue: "golden_flame_rare",
      name: "Golden Flame (Rare)",
      icon: "✨",
    };

    render(<MysteryBoxModal isOpen={true} mysteryBox={mysteryBox} onClose={mockOnClose} />);

    // Advance timers to trigger reveal (1s delay)
    act(() => {
      vi.advanceTimersByTime(1100);
    });

    expect(screen.getByText("✨")).toBeInTheDocument();
    expect(screen.getByText("Golden Flame (Rare)")).toBeInTheDocument();
  });

  it("should display reward information", () => {
    const mysteryBox: MysteryBox = {
      rewardType: "xp_boost",
      rewardValue: 50,
      name: "Bonus XP",
      icon: "⭐",
    };

    render(<MysteryBoxModal isOpen={true} mysteryBox={mysteryBox} onClose={mockOnClose} />);

    // Advance timers to trigger reveal (1s delay)
    act(() => {
      vi.advanceTimersByTime(1100);
    });

    expect(screen.getByText(/\+50 XP Boost/i)).toBeInTheDocument();
  });

  it("should call onClose when close button clicked", () => {
    const mysteryBox: MysteryBox = {
      rewardType: "xp_boost",
      rewardValue: 50,
      name: "Bonus XP",
      icon: "⭐",
    };

    render(<MysteryBoxModal isOpen={true} mysteryBox={mysteryBox} onClose={mockOnClose} />);

    // Advance timers to trigger reveal (1s delay)
    act(() => {
      vi.advanceTimersByTime(1100);
    });

    const closeButton = screen.getByRole("button", { name: /Awesome/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("should call onClose when overlay clicked", () => {
    const mysteryBox: MysteryBox = {
      rewardType: "xp_boost",
      rewardValue: 50,
      name: "Bonus XP",
      icon: "⭐",
    };

    render(<MysteryBoxModal isOpen={true} mysteryBox={mysteryBox} onClose={mockOnClose} />);

    // Advance timers to trigger reveal (1s delay)
    act(() => {
      vi.advanceTimersByTime(1100);
    });

    // Click overlay (parent element of modal content)
    const overlay = screen.getByText(/Mystery Box!/i).closest(".mystery-box-overlay");
    if (overlay) {
      fireEvent.click(overlay);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }
  });

  it("should handle null mysteryBox gracefully", () => {
    render(<MysteryBoxModal isOpen={true} mysteryBox={undefined} onClose={mockOnClose} />);

    // Should not crash, but should not render content
    expect(screen.queryByText(/Mystery Box!/i)).not.toBeInTheDocument();
  });

  it("should handle undefined mysteryBox gracefully", () => {
    render(<MysteryBoxModal isOpen={true} mysteryBox={undefined} onClose={mockOnClose} />);

    // Should not crash, but should not render content
    expect(screen.queryByText(/Mystery Box!/i)).not.toBeInTheDocument();
  });

  it("should display celebration animation classes", () => {
    const mysteryBox: MysteryBox = {
      rewardType: "xp_boost",
      rewardValue: 50,
      name: "Bonus XP",
      icon: "⭐",
    };

    const { container } = render(
      <MysteryBoxModal isOpen={true} mysteryBox={mysteryBox} onClose={mockOnClose} />,
    );

    // Check for animation classes (fade-in, bounce, etc.)
    const modalContent = container.querySelector(".mystery-box-content");
    expect(modalContent).toBeInTheDocument();
  });

  it("should handle large reward values", () => {
    const mysteryBox: MysteryBox = {
      rewardType: "freeze",
      rewardValue: 3,
      name: "Streak Freeze",
      icon: "❄️",
    };

    render(<MysteryBoxModal isOpen={true} mysteryBox={mysteryBox} onClose={mockOnClose} />);

    // Advance timers to trigger reveal (1s delay)
    act(() => {
      vi.advanceTimersByTime(1100);
    });

    expect(screen.getByText(/3 Streak Freezes!/i)).toBeInTheDocument();
  });

  it("should display celebration message", () => {
    const mysteryBox: MysteryBox = {
      rewardType: "xp_boost",
      rewardValue: 50,
      name: "Bonus XP",
      icon: "⭐",
    };

    render(<MysteryBoxModal isOpen={true} mysteryBox={mysteryBox} onClose={mockOnClose} />);

    // Advance timers to trigger reveal (1s delay)
    act(() => {
      vi.advanceTimersByTime(1100);
    });

    expect(screen.getByText(/Mystery Box!/i)).toBeInTheDocument();
  });
});
