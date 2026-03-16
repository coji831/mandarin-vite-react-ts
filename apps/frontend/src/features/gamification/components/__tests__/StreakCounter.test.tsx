/**
 * StreakCounter Component Tests
 * Story 15.7: Gamification & AI Feedback Display UI
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import StreakCounter from "../StreakCounter";
import type { StreakData } from "../../types/GamificationTypes";

describe("StreakCounter", () => {
  const createStreakData = (hoursAgo: number): StreakData => ({
    currentStreak: 7,
    longestStreak: 12,
    freezeCount: 3,
    lastActivityDate: new Date(Date.now() - hoursAgo * 60 * 60 * 1000),
  });

  describe("Active streak state (< 24h)", () => {
    it("shows green flame when activity within 24 hours", () => {
      const streakData = createStreakData(12);
      render(<StreakCounter streakData={streakData} />);

      expect(screen.getByText("🔥")).toBeInTheDocument();
      expect(screen.getByText("7 Day Streak!")).toBeInTheDocument();
      expect(screen.getByText("Keep it going!")).toBeInTheDocument();
    });

    it("applies active styling class", () => {
      const streakData = createStreakData(12);
      const { container } = render(<StreakCounter streakData={streakData} />);

      const streakCounter = container.querySelector(".streak-counter");
      expect(streakCounter).toHaveClass("streak-active");
    });
  });

  describe("At risk streak state (24-48h)", () => {
    it("shows warning message when activity 24-48 hours ago", () => {
      const streakData = createStreakData(36);
      render(<StreakCounter streakData={streakData} />);

      expect(screen.getByText("Streak at risk!")).toBeInTheDocument();
      expect(
        screen.getByText(/Complete a quiz today to save your 7-day streak/),
      ).toBeInTheDocument();
    });

    it("applies at-risk styling class", () => {
      const streakData = createStreakData(36);
      const { container } = render(<StreakCounter streakData={streakData} />);

      const streakCounter = container.querySelector(".streak-counter");
      expect(streakCounter).toHaveClass("streak-at-risk");
    });

    it("still shows flame icon in at-risk state", () => {
      const streakData = createStreakData(30);
      render(<StreakCounter streakData={streakData} />);

      expect(screen.getByText("🔥")).toBeInTheDocument();
    });
  });

  describe("Broken streak state (> 48h)", () => {
    it("shows tombstone and broken message when activity > 48 hours ago", () => {
      const streakData = createStreakData(72);
      render(<StreakCounter streakData={streakData} />);

      expect(screen.getByText("🪦")).toBeInTheDocument();
      expect(screen.getByText("Build your streak")).toBeInTheDocument();
    });

    it("applies broken styling class", () => {
      const streakData = createStreakData(72);
      const { container } = render(<StreakCounter streakData={streakData} />);

      const streakCounter = container.querySelector(".streak-counter");
      expect(streakCounter).toHaveClass("streak-broken");
    });

    it("does not show Keep it going subtitle in broken state", () => {
      const streakData = createStreakData(72);
      render(<StreakCounter streakData={streakData} />);

      expect(screen.queryByText("Keep it going!")).not.toBeInTheDocument();
    });
  });

  describe("Freeze counter", () => {
    it("displays freeze count correctly", () => {
      const streakData = createStreakData(12);
      render(<StreakCounter streakData={streakData} />);

      expect(screen.getByText("❄️")).toBeInTheDocument();
      expect(screen.getByText("x3 Freezes Available")).toBeInTheDocument();
    });

    it("shows tooltip text", () => {
      const streakData = createStreakData(12);
      render(<StreakCounter streakData={streakData} />);

      expect(screen.getByText(/Streak Freezes protect your streak/)).toBeInTheDocument();
    });

    it("handles 0 freezes", () => {
      const streakData = { ...createStreakData(12), freezeCount: 0 };
      render(<StreakCounter streakData={streakData} />);

      expect(screen.getByText("x0 Freezes Available")).toBeInTheDocument();
    });

    it("handles multiple freezes", () => {
      const streakData = { ...createStreakData(12), freezeCount: 5 };
      render(<StreakCounter streakData={streakData} />);

      expect(screen.getByText("x5 Freezes Available")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has aria-label for streak status", () => {
      const streakData = createStreakData(12);
      render(<StreakCounter streakData={streakData} />);

      const icon = screen.getByLabelText("Streak status: active");
      expect(icon).toBeInTheDocument();
    });

    it("has aria-label for freeze icon", () => {
      const streakData = createStreakData(12);
      render(<StreakCounter streakData={streakData} />);

      const freezeIcon = screen.getByLabelText("Streak freezes available");
      expect(freezeIcon).toBeInTheDocument();
    });

    it("tooltip has role attribute", () => {
      const streakData = createStreakData(12);
      render(<StreakCounter streakData={streakData} />);

      const tooltip = screen.getByRole("tooltip", { hidden: true });
      expect(tooltip).toBeInTheDocument();
    });
  });

  describe("Edge cases", () => {
    it("handles exactly 24 hours (boundary)", () => {
      const streakData = createStreakData(24);
      render(<StreakCounter streakData={streakData} />);

      expect(screen.getByText("Streak at risk!")).toBeInTheDocument();
    });

    it("handles exactly 48 hours (boundary)", () => {
      const streakData = createStreakData(48);
      render(<StreakCounter streakData={streakData} />);

      expect(screen.getByText("Build your streak")).toBeInTheDocument();
    });

    it("handles very recent activity (< 1 hour)", () => {
      const streakData = createStreakData(0.5);
      render(<StreakCounter streakData={streakData} />);

      expect(screen.getByText("7 Day Streak!")).toBeInTheDocument();
    });
  });
});
