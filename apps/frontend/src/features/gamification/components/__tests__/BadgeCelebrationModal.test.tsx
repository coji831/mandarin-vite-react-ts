/**
 * @file BadgeCelebrationModal.test.tsx
 * @description Tests for BadgeCelebrationModal component
 * Story 15.11: Business Logic Flows - Badge Award Celebration (Flow 2.6)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { BadgeCelebrationModal } from "../BadgeCelebrationModal";
import type { Badge } from "../../types/GamificationTypes";

describe("BadgeCelebrationModal", () => {
  const mockBadge: Badge = {
    id: "bronze_flame",
    name: "Bronze Flame",
    description: "Maintain a 7-day streak",
    icon: "🔥",
    streakRequired: 7,
  };

  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("renders when open with badge data", () => {
    render(<BadgeCelebrationModal badges={[mockBadge]} isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText("🎉 New Badge Earned!")).toBeInTheDocument();
    expect(screen.getByText(mockBadge.name)).toBeInTheDocument();
    if (mockBadge.description) {
      expect(screen.getByText(mockBadge.description)).toBeInTheDocument();
    }
    expect(screen.getByText(mockBadge.icon)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Awesome! 🎉/i })).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<BadgeCelebrationModal badges={[mockBadge]} isOpen={false} onClose={mockOnClose} />);

    expect(screen.queryByText("🎉 New Badge Earned!")).not.toBeInTheDocument();
  });

  it("does not render when badges array is empty", () => {
    render(<BadgeCelebrationModal badges={[]} isOpen={true} onClose={mockOnClose} />);

    expect(screen.queryByText("🎉 New Badge Earned!")).not.toBeInTheDocument();
  });

  it("auto-dismisses after 5 seconds", () => {
    render(<BadgeCelebrationModal badges={[mockBadge]} isOpen={true} onClose={mockOnClose} />);

    expect(mockOnClose).not.toHaveBeenCalled();

    // Fast-forward time by 5 seconds
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("manual dismiss via button click", () => {
    render(<BadgeCelebrationModal badges={[mockBadge]} isOpen={true} onClose={mockOnClose} />);

    const button = screen.getByRole("button", { name: /Awesome! 🎉/i });
    fireEvent.click(button);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("manual dismiss via overlay click", () => {
    render(<BadgeCelebrationModal badges={[mockBadge]} isOpen={true} onClose={mockOnClose} />);

    const overlay = screen.getByText("🎉 New Badge Earned!").closest(".modal-overlay");
    expect(overlay).toBeInTheDocument();

    if (overlay) {
      fireEvent.click(overlay);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }
  });

  it("clears auto-dismiss timer on manual dismiss", () => {
    render(<BadgeCelebrationModal badges={[mockBadge]} isOpen={true} onClose={mockOnClose} />);

    // Click button after 2 seconds (before auto-dismiss)
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    const button = screen.getByRole("button", { name: /Awesome! 🎉/i });
    fireEvent.click(button);

    expect(mockOnClose).toHaveBeenCalledTimes(1);

    // Advance time to 5 seconds total - onClose should NOT be called again
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(mockOnClose).toHaveBeenCalledTimes(1); // Still only 1 call
  });

  it("handles multiple badges gracefully (shows first badge)", () => {
    const badges: Badge[] = [
      {
        id: "bronze_flame",
        name: "Bronze Flame",
        description: "Maintain a 7-day streak",
        icon: "🔥",
        streakRequired: 7,
      },
      {
        id: "silver_flame",
        name: "Silver Flame",
        description: "Maintain a 30-day streak",
        icon: "🔥",
        streakRequired: 30,
      },
    ];

    render(<BadgeCelebrationModal badges={badges} isOpen={true} onClose={mockOnClose} />);

    // Should display first badge
    expect(screen.getByText("Bronze Flame")).toBeInTheDocument();
    expect(screen.getByText("Maintain a 7-day streak")).toBeInTheDocument();

    // Should NOT display second badge
    expect(screen.queryByText("Silver Flame")).not.toBeInTheDocument();
    expect(screen.queryByText("Maintain a 30-day streak")).not.toBeInTheDocument();

    // Should show multiple badge indicator
    expect(screen.getByText("+1 more badge")).toBeInTheDocument();
  });

  it("displays correct multiple badge indicator text", () => {
    const badges: Badge[] = [
      {
        id: "badge1",
        name: "Badge 1",
        description: "First badge",
        icon: "🔥",
      },
      {
        id: "badge2",
        name: "Badge 2",
        description: "Second badge",
        icon: "💎",
      },
      {
        id: "badge3",
        name: "Badge 3",
        description: "Third badge",
        icon: "⭐",
      },
    ];

    render(<BadgeCelebrationModal badges={badges} isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText("+2 more badges")).toBeInTheDocument();
  });

  it("renders confetti animation elements", () => {
    const { container } = render(
      <BadgeCelebrationModal badges={[mockBadge]} isOpen={true} onClose={mockOnClose} />,
    );

    const confettiContainer = container.querySelector(".confetti-container");
    expect(confettiContainer).toBeInTheDocument();

    const confettiPieces = container.querySelectorAll(".confetti-piece");
    expect(confettiPieces).toHaveLength(30); // 30 confetti pieces
  });

  it("cleans up timer on unmount", () => {
    const { unmount } = render(
      <BadgeCelebrationModal badges={[mockBadge]} isOpen={true} onClose={mockOnClose} />,
    );

    unmount();

    // Advance time after unmount
    vi.advanceTimersByTime(5000);

    expect(mockOnClose).not.toHaveBeenCalled();
  });
});
