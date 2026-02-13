/**
 * BadgeDisplay Component Tests
 * Story 15.7: Gamification & AI Feedback Display UI
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import BadgeDisplay from "../BadgeDisplay";
import type { Badge } from "../../types/GamificationTypes";

describe("BadgeDisplay", () => {
  const earnedBadge: Badge = {
    id: "bronze_flame",
    name: "Bronze Flame",
    description: "Maintain a 7-day streak",
    icon: "🔥",
    streakRequired: 7,
    earnedDate: new Date("2026-01-20"),
  };

  const lockedBadge: Badge = {
    id: "silver_flame",
    name: "Silver Flame",
    description: "Maintain a 30-day streak",
    icon: "🔥",
    streakRequired: 30,
    progress: 15,
    percentComplete: 50,
  };

  const badges = [earnedBadge, lockedBadge];

  beforeEach(() => {
    // Reset body overflow before each test
    document.body.style.overflow = "";
  });

  afterEach(() => {
    // Clean up after tests
    document.body.style.overflow = "";
  });

  describe("Badge grid rendering", () => {
    it("renders all badges in the list", () => {
      render(<BadgeDisplay badges={badges} />);

      expect(screen.getByText("Bronze Flame")).toBeInTheDocument();
      expect(screen.getByText("Silver Flame")).toBeInTheDocument();
    });

    it("renders achievements title", () => {
      render(<BadgeDisplay badges={badges} />);

      expect(screen.getByText("Achievements")).toBeInTheDocument();
    });

    it("displays badge icons", () => {
      render(<BadgeDisplay badges={badges} />);

      const icons = screen.getAllByText("🔥");
      expect(icons.length).toBeGreaterThanOrEqual(2);
    });

    it("applies earned styling to earned badges", () => {
      render(<BadgeDisplay badges={badges} />);

      const earnedButton = screen.getByRole("listitem", {
        name: /Bronze Flame.*Earned/,
      });
      expect(earnedButton).toHaveClass("badge-earned");
    });

    it("applies locked styling to locked badges", () => {
      render(<BadgeDisplay badges={badges} />);

      const lockedButton = screen.getByRole("listitem", {
        name: /Silver Flame.*Locked/,
      });
      expect(lockedButton).toHaveClass("badge-locked");
    });

    it("shows progress percentage for locked badges", () => {
      render(<BadgeDisplay badges={badges} />);

      expect(screen.getByText("50%")).toBeInTheDocument();
    });

    it("does not show progress for earned badges", () => {
      const singleEarnedBadge = [earnedBadge];
      render(<BadgeDisplay badges={singleEarnedBadge} />);

      // Should not have any percentage text
      expect(screen.queryByText(/\d+%/)).not.toBeInTheDocument();
    });
  });

  describe("Modal interaction", () => {
    it("opens modal when badge is clicked", () => {
      render(<BadgeDisplay badges={badges} />);

      const badgeButton = screen.getByRole("listitem", {
        name: /Bronze Flame.*Earned/,
      });
      fireEvent.click(badgeButton);

      const modal = screen.getByRole("dialog");
      expect(modal).toBeInTheDocument();
    });

    it("displays badge details in modal", () => {
      render(<BadgeDisplay badges={badges} />);

      const badgeButton = screen.getByRole("listitem", {
        name: /Bronze Flame.*Earned/,
      });
      fireEvent.click(badgeButton);

      expect(screen.getByText("Maintain a 7-day streak")).toBeInTheDocument();
    });

    it("shows earned date for earned badge in modal", () => {
      render(<BadgeDisplay badges={badges} />);

      const badgeButton = screen.getByRole("listitem", {
        name: /Bronze Flame.*Earned/,
      });
      fireEvent.click(badgeButton);

      expect(screen.getByText("Earned on:")).toBeInTheDocument();
      expect(screen.getByText("January 20, 2026")).toBeInTheDocument();
    });

    it("shows progress for locked badge in modal", () => {
      render(<BadgeDisplay badges={badges} />);

      const badgeButton = screen.getByRole("listitem", {
        name: /Silver Flame.*Locked/,
      });
      fireEvent.click(badgeButton);

      expect(screen.getByText("Progress")).toBeInTheDocument();
      expect(screen.getByText("15 / 30 days")).toBeInTheDocument();
      expect(screen.getByText("50% Complete")).toBeInTheDocument();
    });

    it("closes modal when close button is clicked", () => {
      render(<BadgeDisplay badges={badges} />);

      const badgeButton = screen.getByRole("listitem", {
        name: /Bronze Flame.*Earned/,
      });
      fireEvent.click(badgeButton);

      const closeButton = screen.getByLabelText("Close modal");
      fireEvent.click(closeButton);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("closes modal when backdrop is clicked", () => {
      render(<BadgeDisplay badges={badges} />);

      const badgeButton = screen.getByRole("listitem", {
        name: /Bronze Flame.*Earned/,
      });
      fireEvent.click(badgeButton);

      const backdrop = screen.getByRole("dialog");
      fireEvent.click(backdrop);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("does not close modal when modal content is clicked", () => {
      render(<BadgeDisplay badges={badges} />);

      const badgeButton = screen.getByRole("listitem", {
        name: /Bronze Flame.*Earned/,
      });
      fireEvent.click(badgeButton);

      const modalTitle = screen.getByRole("heading", {
        name: "Bronze Flame",
      });
      fireEvent.click(modalTitle);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("closes modal when Escape key is pressed", () => {
      render(<BadgeDisplay badges={badges} />);

      const badgeButton = screen.getByRole("listitem", {
        name: /Bronze Flame.*Earned/,
      });
      fireEvent.click(badgeButton);

      fireEvent.keyDown(document, { key: "Escape" });

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("prevents body scroll when modal is open", () => {
      render(<BadgeDisplay badges={badges} />);

      const badgeButton = screen.getByRole("listitem", {
        name: /Bronze Flame.*Earned/,
      });
      fireEvent.click(badgeButton);

      expect(document.body.style.overflow).toBe("hidden");
    });

    it("restores body scroll when modal is closed", () => {
      render(<BadgeDisplay badges={badges} />);

      const badgeButton = screen.getByRole("listitem", {
        name: /Bronze Flame.*Earned/,
      });
      fireEvent.click(badgeButton);

      const closeButton = screen.getByLabelText("Close modal");
      fireEvent.click(closeButton);

      expect(document.body.style.overflow).toBe("");
    });
  });

  describe("Accessibility", () => {
    it("badge grid has list role", () => {
      render(<BadgeDisplay badges={badges} />);

      const grid = screen.getByRole("list");
      expect(grid).toHaveClass("badge-grid");
    });

    it("badge buttons have listitem role", () => {
      render(<BadgeDisplay badges={badges} />);

      const items = screen.getAllByRole("listitem");
      expect(items.length).toBe(2);
    });

    it("modal has proper dialog role and aria-modal", () => {
      render(<BadgeDisplay badges={badges} />);

      const badgeButton = screen.getByRole("listitem", {
        name: /Bronze Flame.*Earned/,
      });
      fireEvent.click(badgeButton);

      const modal = screen.getByRole("dialog");
      expect(modal).toHaveAttribute("aria-modal", "true");
      expect(modal).toHaveAttribute("aria-labelledby", "modal-title");
    });

    it("modal title has correct id for aria-labelledby", () => {
      render(<BadgeDisplay badges={badges} />);

      const badgeButton = screen.getByRole("listitem", {
        name: /Bronze Flame.*Earned/,
      });
      fireEvent.click(badgeButton);

      const title = screen.getByRole("heading", { name: "Bronze Flame" });
      expect(title).toHaveAttribute("id", "modal-title");
    });

    it("close button has aria-label", () => {
      render(<BadgeDisplay badges={badges} />);

      const badgeButton = screen.getByRole("listitem", {
        name: /Bronze Flame.*Earned/,
      });
      fireEvent.click(badgeButton);

      const closeButton = screen.getByLabelText("Close modal");
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe("Edge cases", () => {
    it("handles empty badges array", () => {
      render(<BadgeDisplay badges={[]} />);

      expect(screen.getByText("Achievements")).toBeInTheDocument();
      expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
    });

    it("handles badge without percentComplete", () => {
      const badgeWithoutPercent: Badge = {
        ...lockedBadge,
        percentComplete: undefined,
      };
      render(<BadgeDisplay badges={[badgeWithoutPercent]} />);

      expect(screen.queryByText(/\d+%/)).not.toBeInTheDocument();
    });

    it("handles multiple badge clicks (switches modal content)", () => {
      render(<BadgeDisplay badges={badges} />);

      // Click first badge
      const firstBadge = screen.getByRole("listitem", {
        name: /Bronze Flame.*Earned/,
      });
      fireEvent.click(firstBadge);
      expect(screen.getByText("January 20, 2026")).toBeInTheDocument();

      // Close modal
      fireEvent.click(screen.getByLabelText("Close modal"));

      // Click second badge
      const secondBadge = screen.getByRole("listitem", {
        name: /Silver Flame.*Locked/,
      });
      fireEvent.click(secondBadge);
      expect(screen.getByText("15 / 30 days")).toBeInTheDocument();
    });

    it("handles badge with 0% progress", () => {
      const zeroBadge: Badge = {
        ...lockedBadge,
        progress: 0,
        percentComplete: 0,
      };
      render(<BadgeDisplay badges={[zeroBadge]} />);

      expect(screen.getByText("0%")).toBeInTheDocument();
    });

    it("handles badge with 100% progress (not yet earned)", () => {
      const fullBadge: Badge = {
        ...lockedBadge,
        progress: 30,
        percentComplete: 100,
        earnedDate: undefined,
      };
      render(<BadgeDisplay badges={[fullBadge]} />);

      expect(screen.getByText("100%")).toBeInTheDocument();
    });
  });

  describe("Responsive behavior", () => {
    it("renders grid with proper class", () => {
      render(<BadgeDisplay badges={badges} />);

      const grid = screen.getByRole("list");
      expect(grid).toHaveClass("badge-grid");
    });
  });
});
