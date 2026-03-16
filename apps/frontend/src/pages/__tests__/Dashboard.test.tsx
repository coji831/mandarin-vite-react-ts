/**
 * Integration Tests for Dashboard Page
 * Story 15.9: Gamification & AI Integration
 *
 * Tests Dashboard integration with gamification features:
 * - Loading streak and badge data
 * - Displaying live gamification stats
 * - Freeze spending workflow
 * - Badge celebration modal
 * - Error handling
 * - localStorage persistence
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import MockAdapter from "axios-mock-adapter";
import { apiClient } from "../../services/axiosClient";
import { Dashboard } from "../Dashboard";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";

// ============================================================================
// Mock Setup
// ============================================================================

const mock = new MockAdapter(apiClient);

const mockStreakResponse = {
  currentStreak: 7,
  longestStreak: 12,
  freezeCount: 3,
  lastActivityDate: "2026-02-15T08:00:00.000Z",
};

const mockBadgeResponse = {
  earned: [
    {
      id: "bronze_flame",
      name: "Bronze Flame",
      streakRequired: 7,
      icon: "🔥",
      earnedDate: "2026-02-08T10:00:00.000Z",
    },
  ],
  available: [
    {
      id: "silver_flame",
      name: "Silver Flame",
      streakRequired: 30,
      icon: "🔥",
      progress: 7,
      percentComplete: 23,
    },
  ],
};

const mockFreezeResponse = {
  message: "Freeze spent successfully",
  currentStreak: 7,
  freezeCount: 2,
  lastActivityDate: "2026-02-15T08:00:00.000Z",
};

// Mock alert
global.alert = vi.fn();

// Helper to render with router
const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("Dashboard Integration", () => {
  beforeEach(() => {
    mock.reset();
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    mock.reset();
    localStorage.clear();
  });

  it("should load and display streak data", async () => {
    mock.onGet(ROUTE_PATTERNS.progressStreak).reply(200, mockStreakResponse);
    mock.onGet(ROUTE_PATTERNS.gamificationBadges).reply(200, mockBadgeResponse);

    renderWithRouter(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Welcome Back! 👋")).toBeInTheDocument();
    });

    // Verify streak display
    expect(screen.getByText(/7/)).toBeInTheDocument(); // Current streak
    expect(screen.getByText(/🔥/)).toBeInTheDocument(); // Fire icon
  });

  it("should load and display badge data", async () => {
    mock.onGet(ROUTE_PATTERNS.progressStreak).reply(200, mockStreakResponse);
    mock.onGet(ROUTE_PATTERNS.gamificationBadges).reply(200, mockBadgeResponse);

    renderWithRouter(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Welcome Back! 👋")).toBeInTheDocument();
    });

    // Verify badge display
    expect(screen.getByText("Bronze Flame")).toBeInTheDocument();
    expect(screen.getByText("Silver Flame")).toBeInTheDocument();
  });

  it("should display loading state initially", () => {
    mock.onGet(ROUTE_PATTERNS.progressStreak).reply(() => {
      return new Promise((resolve) => {
        setTimeout(() => resolve([200, mockStreakResponse]), 100);
      });
    });
    mock.onGet(ROUTE_PATTERNS.gamificationBadges).reply(() => {
      return new Promise((resolve) => {
        setTimeout(() => resolve([200, mockBadgeResponse]), 100);
      });
    });

    renderWithRouter(<Dashboard />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("should handle API errors gracefully", async () => {
    mock.onGet(ROUTE_PATTERNS.progressStreak).reply(500, { error: "Server error" });
    mock.onGet(ROUTE_PATTERNS.gamificationBadges).reply(200, mockBadgeResponse);

    renderWithRouter(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Error Loading Dashboard/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Server error/i)).toBeInTheDocument();
  });

  it("should handle badge errors gracefully", async () => {
    mock.onGet(ROUTE_PATTERNS.progressStreak).reply(200, mockStreakResponse);
    mock.onGet(ROUTE_PATTERNS.gamificationBadges).reply(401, { error: "Unauthorized" });

    renderWithRouter(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Error Loading Dashboard/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Unauthorized/i)).toBeInTheDocument();
  });

  it("should show freeze count", async () => {
    mock.onGet(ROUTE_PATTERNS.progressStreak).reply(200, mockStreakResponse);
    mock.onGet(ROUTE_PATTERNS.gamificationBadges).reply(200, mockBadgeResponse);

    renderWithRouter(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Welcome Back! 👋")).toBeInTheDocument();
    });

    // Check for freeze count display (❄️ icon + count)
    expect(screen.getByText(/3/)).toBeInTheDocument();
    expect(screen.getByText(/❄️/)).toBeInTheDocument();
  });

  it("should open freeze confirmation modal", async () => {
    mock.onGet(ROUTE_PATTERNS.progressStreak).reply(200, mockStreakResponse);
    mock.onGet(ROUTE_PATTERNS.gamificationBadges).reply(200, mockBadgeResponse);

    renderWithRouter(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Welcome Back! 👋")).toBeInTheDocument();
    });

    // Find and click freeze button
    const freezeButton = screen.getByRole("button", { name: /freeze/i });
    fireEvent.click(freezeButton);

    // Modal should appear
    await waitFor(() => {
      expect(screen.getByText(/Spend Streak Freeze/i)).toBeInTheDocument();
    });
  });

  it("should spend freeze successfully", async () => {
    mock.onGet(ROUTE_PATTERNS.progressStreak).reply(200, mockStreakResponse);
    mock.onGet(ROUTE_PATTERNS.gamificationBadges).reply(200, mockBadgeResponse);
    mock.onPost(ROUTE_PATTERNS.progressStreakFreeze).reply(200, mockFreezeResponse);

    renderWithRouter(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Welcome Back! 👋")).toBeInTheDocument();
    });

    // Click freeze button
    const freezeButton = screen.getByRole("button", { name: /freeze/i });
    fireEvent.click(freezeButton);

    // Confirm freeze spend
    await waitFor(() => {
      expect(screen.getByText(/Spend Streak Freeze/i)).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole("button", { name: /confirm/i });
    fireEvent.click(confirmButton);

    // Wait for API call and alert
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith(expect.stringContaining("Streak freeze activated"));
    });

    // Verify freeze count updated (3 → 2)
    await waitFor(() => {
      expect(screen.getByText(/2/)).toBeInTheDocument();
    });
  });

  it("should handle freeze spending errors", async () => {
    mock.onGet(ROUTE_PATTERNS.progressStreak).reply(200, mockStreakResponse);
    mock.onGet(ROUTE_PATTERNS.gamificationBadges).reply(200, mockBadgeResponse);
    mock.onPost(ROUTE_PATTERNS.progressStreakFreeze).reply(400, { error: "No freezes available" });

    renderWithRouter(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Welcome Back! 👋")).toBeInTheDocument();
    });

    // Click freeze button
    const freezeButton = screen.getByRole("button", { name: /freeze/i });
    fireEvent.click(freezeButton);

    // Confirm freeze spend
    await waitFor(() => {
      expect(screen.getByText(/Spend Streak Freeze/i)).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole("button", { name: /confirm/i });
    fireEvent.click(confirmButton);

    // Wait for error alert
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith(expect.stringContaining("No freezes available"));
    });
  });

  it("should show badge celebration modal for new badges", async () => {
    // First load: no badges in localStorage
    mock.onGet(ROUTE_PATTERNS.progressStreak).reply(200, mockStreakResponse);
    mock.onGet(ROUTE_PATTERNS.gamificationBadges).reply(200, mockBadgeResponse);

    renderWithRouter(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Welcome Back! 👋")).toBeInTheDocument();
    });

    // No celebration modal on first load (sets baseline)
    expect(screen.queryByText(/New Badge Earned/i)).not.toBeInTheDocument();

    // Store current badges
    const lastSeenBadges = localStorage.getItem("last_seen_badges");
    expect(lastSeenBadges).toBe(JSON.stringify(["bronze_flame"]));
  });

  it("should detect and celebrate newly earned badges", async () => {
    // Set previous state: no badges earned
    localStorage.setItem("last_seen_badges", JSON.stringify([]));

    mock.onGet(ROUTE_PATTERNS.progressStreak).reply(200, mockStreakResponse);
    mock.onGet(ROUTE_PATTERNS.gamificationBadges).reply(200, mockBadgeResponse);

    renderWithRouter(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Welcome Back! 👋")).toBeInTheDocument();
    });

    // Badge celebration modal should appear
    await waitFor(() => {
      expect(screen.getByText(/New Badge/i)).toBeInTheDocument();
    });

    expect(screen.getByText("Bronze Flame")).toBeInTheDocument();
  });

  it("should close badge celebration modal", async () => {
    localStorage.setItem("last_seen_badges", JSON.stringify([]));

    mock.onGet(ROUTE_PATTERNS.progressStreak).reply(200, mockStreakResponse);
    mock.onGet(ROUTE_PATTERNS.gamificationBadges).reply(200, mockBadgeResponse);

    renderWithRouter(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/New Badge/i)).toBeInTheDocument();
    });

    const closeButton = screen.getByRole("button", { name: /close|dismiss|awesome/i });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText(/New Badge/i)).not.toBeInTheDocument();
    });
  });

  it("should display longest streak", async () => {
    mock.onGet(ROUTE_PATTERNS.progressStreak).reply(200, mockStreakResponse);
    mock.onGet(ROUTE_PATTERNS.gamificationBadges).reply(200, mockBadgeResponse);

    renderWithRouter(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Welcome Back! 👋")).toBeInTheDocument();
    });

    expect(screen.getByText(/12/)).toBeInTheDocument(); // Longest streak
  });

  it("should integrate with LeechWidget", async () => {
    mock.onGet(ROUTE_PATTERNS.progressStreak).reply(200, mockStreakResponse);
    mock.onGet(ROUTE_PATTERNS.gamificationBadges).reply(200, mockBadgeResponse);
    mock.onGet(ROUTE_PATTERNS.learningLeeches).reply(200, {
      count: 5,
      leeches: [
        {
          id: "hsk3-band1-001",
          simplified: "你好",
          pinyin: "nǐ hǎo",
          english: "hello",
          lapseCount: 7,
          studyCount: 15,
        },
      ],
    });

    renderWithRouter(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Welcome Back! 👋")).toBeInTheDocument();
    });

    // LeechWidget should render when leeches >= 3
    await waitFor(() => {
      expect(screen.getByText("Focus Words")).toBeInTheDocument();
    });
  });

  it("should handle concurrent API requests", async () => {
    mock.onGet(ROUTE_PATTERNS.progressStreak).reply(200, mockStreakResponse);
    mock.onGet(ROUTE_PATTERNS.gamificationBadges).reply(200, mockBadgeResponse);

    renderWithRouter(<Dashboard />);

    // Both APIs should be called concurrently
    await waitFor(() => {
      expect(screen.getByText("Welcome Back! 👋")).toBeInTheDocument();
    });

    // Verify both data sets loaded
    expect(screen.getByText(/7/)).toBeInTheDocument(); // Streak
    expect(screen.getByText("Bronze Flame")).toBeInTheDocument(); // Badge
  });
});
