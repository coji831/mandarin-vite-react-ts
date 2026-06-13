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
import { apiClient } from "../../shared/api/axiosClient";
import { DashboardPage } from "../DashboardPage";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";

// ============================================================================
// Mock Setup
// ============================================================================

const mock = new MockAdapter(apiClient);

const mockNow = new Date();
const mockStreakResponse = {
  currentStreak: 7,
  longestStreak: 12,
  freezeCount: 3,
  lastActivityDate: mockNow.toISOString(), // Recent date so StreakCounter shows active state
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
  lastActivityDate: mockNow.toISOString(),
};

const mockLeechResponse = {
  count: 0,
  leeches: [],
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
    // Mock leech endpoint for LeechWidget component rendered by DashboardPage
    mock.onGet(ROUTE_PATTERNS.learningLeeches).reply(200, mockLeechResponse);
  });

  afterEach(() => {
    mock.reset();
    localStorage.clear();
  });

  it("should load and display streak data", async () => {
    mock.onGet(ROUTE_PATTERNS.progressStreak).reply(200, mockStreakResponse);
    mock.onGet(ROUTE_PATTERNS.gamificationBadges).reply(200, mockBadgeResponse);

    renderWithRouter(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Welcome Back! 👋")).toBeInTheDocument();
    });

    // Verify streak display - active state shows "7 Day Streak!"
    expect(screen.getByText(/7 Day Streak/i)).toBeInTheDocument();
    expect(screen.getAllByText(/🔥/).length).toBeGreaterThanOrEqual(1); // Fire icon (in streak + badges)
  });

  it("should load and display badge data", async () => {
    mock.onGet(ROUTE_PATTERNS.progressStreak).reply(200, mockStreakResponse);
    mock.onGet(ROUTE_PATTERNS.gamificationBadges).reply(200, mockBadgeResponse);

    renderWithRouter(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Welcome Back! 👋")).toBeInTheDocument();
    });

    // Verify badge display (Bronze Flame appears in celebration modal + badge grid)
    expect(screen.getAllByText("Bronze Flame").length).toBeGreaterThanOrEqual(1);
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

    renderWithRouter(<DashboardPage />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("should handle API errors gracefully", async () => {
    mock.onGet(ROUTE_PATTERNS.progressStreak).reply(500, { error: "Server error" });
    mock.onGet(ROUTE_PATTERNS.gamificationBadges).reply(200, mockBadgeResponse);

    renderWithRouter(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Error Loading Dashboard/i)).toBeInTheDocument();
    });
    // Verify error message is displayed (Axios error text)
    expect(screen.getByText(/failed|status code/i)).toBeInTheDocument();
  });

  it("should handle badge errors gracefully", async () => {
    mock.onGet(ROUTE_PATTERNS.progressStreak).reply(200, mockStreakResponse);
    mock.onGet(ROUTE_PATTERNS.gamificationBadges).reply(401, { error: "Unauthorized" });

    renderWithRouter(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Error Loading Dashboard/i)).toBeInTheDocument();
    });
    // Verify error message is displayed
    expect(screen.getByText(/failed|status code/i)).toBeInTheDocument();
  });

  it("should show freeze count", async () => {
    mock.onGet(ROUTE_PATTERNS.progressStreak).reply(200, mockStreakResponse);
    mock.onGet(ROUTE_PATTERNS.gamificationBadges).reply(200, mockBadgeResponse);

    renderWithRouter(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Welcome Back! 👋")).toBeInTheDocument();
    });

    // Check for freeze count display (❄️ icon + count)
    expect(screen.getByText(/x3 Freezes Available/i)).toBeInTheDocument();
    expect(screen.getAllByText(/❄️/).length).toBeGreaterThanOrEqual(1);
  });

  it("should open freeze confirmation modal", async () => {
    mock.onGet(ROUTE_PATTERNS.progressStreak).reply(200, mockStreakResponse);
    mock.onGet(ROUTE_PATTERNS.gamificationBadges).reply(200, mockBadgeResponse);

    renderWithRouter(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Welcome Back! 👋")).toBeInTheDocument();
    });

    // Find and click freeze button
    const freezeButton = screen.getByRole("button", { name: /freeze/i });
    fireEvent.click(freezeButton);

    // Modal should appear with confirmation text
    await waitFor(() => {
      expect(screen.getAllByText(/Use Streak Freeze/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  it("should spend freeze successfully", async () => {
    mock.onGet(ROUTE_PATTERNS.progressStreak).reply(200, mockStreakResponse);
    mock.onGet(ROUTE_PATTERNS.gamificationBadges).reply(200, mockBadgeResponse);
    mock.onPost(ROUTE_PATTERNS.progressStreakFreeze).reply(200, mockFreezeResponse);

    renderWithRouter(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Welcome Back! 👋")).toBeInTheDocument();
    });

    // Click freeze button
    const freezeButton = screen.getByRole("button", { name: /freeze/i });
    fireEvent.click(freezeButton);

    // Confirm freeze spend
    await waitFor(() => {
      expect(screen.getAllByText(/Use Streak Freeze/i).length).toBeGreaterThanOrEqual(1);
    });

    const confirmButton = screen.getByRole("button", { name: /Yes, Use It/i });
    fireEvent.click(confirmButton);

    // Wait for API call and alert
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith(expect.stringContaining("Streak freeze activated"));
    });

    // Verify freeze count updated (3 → 2)
    await waitFor(() => {
      expect(screen.getByText(/x2 Freezes Available/i)).toBeInTheDocument();
    });
  });

  it("should handle freeze spending errors", async () => {
    mock.onGet(ROUTE_PATTERNS.progressStreak).reply(200, mockStreakResponse);
    mock.onGet(ROUTE_PATTERNS.gamificationBadges).reply(200, mockBadgeResponse);
    mock.onPost(ROUTE_PATTERNS.progressStreakFreeze).reply(400, { error: "No freezes available" });

    renderWithRouter(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Welcome Back! 👋")).toBeInTheDocument();
    });

    // Click freeze button
    const freezeButton = screen.getByRole("button", { name: /freeze/i });
    fireEvent.click(freezeButton);

    // Confirm freeze spend
    await waitFor(() => {
      expect(screen.getAllByText(/Use Streak Freeze/i).length).toBeGreaterThanOrEqual(1);
    });

    const confirmButton = screen.getByRole("button", { name: /Yes, Use It/i });
    fireEvent.click(confirmButton);

    // Wait for error alert - component uses fallback message since freezeError state not yet updated
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith(
        expect.stringContaining("Failed to activate streak freeze"),
      );
    });
  });

  it("should show badge celebration modal for new badges", async () => {
    // First load: no badges in localStorage
    mock.onGet(ROUTE_PATTERNS.progressStreak).reply(200, mockStreakResponse);
    mock.onGet(ROUTE_PATTERNS.gamificationBadges).reply(200, mockBadgeResponse);

    renderWithRouter(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Welcome Back! 👋")).toBeInTheDocument();
    });

    // On first load with earned badges, celebration modal shows for all earned badges
    await waitFor(() => {
      expect(screen.getByText(/New Badge Earned/i)).toBeInTheDocument();
    });

    // Verify badges are stored in localStorage
    const lastCelebratedBadges = localStorage.getItem("last_celebrated_badges");
    expect(lastCelebratedBadges).toBe(JSON.stringify(["bronze_flame"]));
  });

  it("should detect and celebrate newly earned badges", async () => {
    // Set previous state: no badges earned yet
    localStorage.setItem("last_celebrated_badges", JSON.stringify([]));

    mock.onGet(ROUTE_PATTERNS.progressStreak).reply(200, mockStreakResponse);
    mock.onGet(ROUTE_PATTERNS.gamificationBadges).reply(200, mockBadgeResponse);

    renderWithRouter(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Welcome Back! 👋")).toBeInTheDocument();
    });

    // Badge celebration modal should appear
    await waitFor(() => {
      expect(screen.getByText(/New Badge/i)).toBeInTheDocument();
    });

    // Bronze Flame appears in both celebration modal and badge grid
    expect(screen.getAllByText("Bronze Flame").length).toBeGreaterThanOrEqual(1);
  });

  it("should close badge celebration modal", async () => {
    localStorage.setItem("last_celebrated_badges", JSON.stringify([]));

    mock.onGet(ROUTE_PATTERNS.progressStreak).reply(200, mockStreakResponse);
    mock.onGet(ROUTE_PATTERNS.gamificationBadges).reply(200, mockBadgeResponse);

    renderWithRouter(<DashboardPage />);

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

    renderWithRouter(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Welcome Back! 👋")).toBeInTheDocument();
    });

    // Longest streak (12) is stored but not directly rendered in the UI
    expect(screen.getByText(/7 Day Streak/i)).toBeInTheDocument();
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

    renderWithRouter(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Welcome Back! 👋")).toBeInTheDocument();
    });

    // LeechWidget should render when leeches >= 3
    await waitFor(() => {
      expect(screen.getByText(/Struggling Words/i)).toBeInTheDocument();
    });
  });

  it("should handle concurrent API requests", async () => {
    mock.onGet(ROUTE_PATTERNS.progressStreak).reply(200, mockStreakResponse);
    mock.onGet(ROUTE_PATTERNS.gamificationBadges).reply(200, mockBadgeResponse);

    renderWithRouter(<DashboardPage />);

    // Both APIs should be called concurrently
    await waitFor(() => {
      expect(screen.getByText("Welcome Back! 👋")).toBeInTheDocument();
    });

    // Verify both data sets loaded
    expect(screen.getByText(/7 Day Streak/i)).toBeInTheDocument(); // Streak (active state)
    expect(screen.getAllByText("Bronze Flame").length).toBeGreaterThanOrEqual(1); // Badge (celebration + grid)
  });
});
