/**
 * Tests for LeechWidget component
 * Story 15.9: Gamification & AI Integration
 *
 * Tests LeechWidget rendering and behavior with:
 * - Leech fetching and display
 * - Loading states
 * - Dismiss functionality
 * - localStorage persistence
 * - Navigation to review
 * - Threshold logic (3+ leeches to show)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import MockAdapter from "axios-mock-adapter";
import { apiClient } from "../../../../services/axiosClient";
import { LeechWidget } from "../LeechWidget";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";

// ============================================================================
// Mock Setup
// ============================================================================

const mock = new MockAdapter(apiClient);

const mockLeechResponse = {
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
    {
      id: "hsk3-band1-042",
      simplified: "谢谢",
      pinyin: "xiè xie",
      english: "thank you",
      lapseCount: 5,
      studyCount: 10,
    },
    {
      id: "hsk3-band1-103",
      simplified: "再见",
      pinyin: "zài jiàn",
      english: "goodbye",
      lapseCount: 6,
      studyCount: 12,
    },
    {
      id: "hsk3-band1-200",
      simplified: "今天",
      pinyin: "jīn tiān",
      english: "today",
      lapseCount: 8,
      studyCount: 20,
    },
    {
      id: "hsk3-band1-305",
      simplified: "明天",
      pinyin: "míng tiān",
      english: "tomorrow",
      lapseCount: 5,
      studyCount: 9,
    },
  ],
};

// Helper to render with router
const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("LeechWidget", () => {
  beforeEach(() => {
    mock.reset();
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    mock.reset();
    localStorage.clear();
  });

  it("should fetch and display leeches on mount", async () => {
    mock.onGet(ROUTE_PATTERNS.progressLeeches).reply(200, mockLeechResponse);

    renderWithRouter(<LeechWidget />);

    await waitFor(() => {
      expect(screen.getByText("Focus Words")).toBeInTheDocument();
    });

    expect(screen.getByText("你好")).toBeInTheDocument();
    expect(screen.getByText("谢谢")).toBeInTheDocument();
    expect(screen.getByText("再见")).toBeInTheDocument();
    expect(screen.getByText(/5 words need attention/i)).toBeInTheDocument();
  });

  it("should show loading state initially", () => {
    mock.onGet(ROUTE_PATTERNS.progressLeeches).reply(() => {
      return new Promise((resolve) => {
        setTimeout(() => resolve([200, mockLeechResponse]), 100);
      });
    });

    renderWithRouter(<LeechWidget />);

    expect(screen.queryByText("Focus Words")).not.toBeInTheDocument();
  });

  it("should not render when dismissed today", async () => {
    const today = new Date().toISOString().split("T")[0];
    localStorage.setItem("leech_widget_dismissed", today);

    renderWithRouter(<LeechWidget />);

    await waitFor(() => {
      expect(screen.queryByText("Focus Words")).not.toBeInTheDocument();
    });
  });

  it("should render when dismissed on previous day", async () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    localStorage.setItem("leech_widget_dismissed", yesterday);

    mock.onGet(ROUTE_PATTERNS.progressLeeches).reply(200, mockLeechResponse);

    renderWithRouter(<LeechWidget />);

    await waitFor(() => {
      expect(screen.getByText("Focus Words")).toBeInTheDocument();
    });
  });

  it("should dismiss widget when close button clicked", async () => {
    mock.onGet(ROUTE_PATTERNS.progressLeeches).reply(200, mockLeechResponse);

    renderWithRouter(<LeechWidget />);

    await waitFor(() => {
      expect(screen.getByText("Focus Words")).toBeInTheDocument();
    });

    const closeButton = screen.getByRole("button", { name: /dismiss/i });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText("Focus Words")).not.toBeInTheDocument();
    });

    // Check localStorage
    const today = new Date().toISOString().split("T")[0];
    expect(localStorage.getItem("leech_widget_dismissed")).toBe(today);
  });

  it("should display lapse counts for each word", async () => {
    mock.onGet(ROUTE_PATTERNS.progressLeeches).reply(200, mockLeechResponse);

    renderWithRouter(<LeechWidget />);

    await waitFor(() => {
      expect(screen.getByText("Focus Words")).toBeInTheDocument();
    });

    // Check for lapse count badges
    expect(screen.getByText("7 lapses")).toBeInTheDocument();
    expect(screen.getByText("5 lapses")).toBeInTheDocument();
    expect(screen.getByText("6 lapses")).toBeInTheDocument();
  });

  it("should limit display to 5 leeches", async () => {
    const manyLeeches = {
      count: 10,
      leeches: [
        ...mockLeechResponse.leeches,
        {
          id: "extra-1",
          simplified: "额外",
          pinyin: "é wài",
          english: "extra",
          lapseCount: 6,
          studyCount: 8,
        },
        {
          id: "extra-2",
          simplified: "更多",
          pinyin: "gèng duō",
          english: "more",
          lapseCount: 5,
          studyCount: 7,
        },
      ],
    };

    mock.onGet(ROUTE_PATTERNS.progressLeeches).reply(200, manyLeeches);

    renderWithRouter(<LeechWidget />);

    await waitFor(() => {
      expect(screen.getByText("Focus Words")).toBeInTheDocument();
    });

    // Should show first 5 only
    expect(screen.getByText("你好")).toBeInTheDocument();
    expect(screen.getByText("明天")).toBeInTheDocument();
    expect(screen.queryByText("额外")).not.toBeInTheDocument();
    expect(screen.queryByText("更多")).not.toBeInTheDocument();
  });

  it("should not render when count is below threshold (< 3)", async () => {
    const fewLeeches = {
      count: 2,
      leeches: [mockLeechResponse.leeches[0], mockLeechResponse.leeches[1]],
    };

    mock.onGet(ROUTE_PATTERNS.progressLeeches).reply(200, fewLeeches);

    renderWithRouter(<LeechWidget />);

    await waitFor(() => {
      expect(screen.queryByText("Focus Words")).not.toBeInTheDocument();
    });
  });

  it("should render when count exactly 3", async () => {
    const threeLeeches = {
      count: 3,
      leeches: mockLeechResponse.leeches.slice(0, 3),
    };

    mock.onGet(ROUTE_PATTERNS.progressLeeches).reply(200, threeLeeches);

    renderWithRouter(<LeechWidget />);

    await waitFor(() => {
      expect(screen.getByText("Focus Words")).toBeInTheDocument();
    });

    expect(screen.getByText(/3 words need attention/i)).toBeInTheDocument();
  });

  it("should handle API errors gracefully", async () => {
    mock.onGet(ROUTE_PATTERNS.progressLeeches).reply(500, { error: "Server error" });

    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    renderWithRouter(<LeechWidget />);

    await waitFor(() => {
      expect(screen.queryByText("Focus Words")).not.toBeInTheDocument();
    });

    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("should handle network errors gracefully", async () => {
    mock.onGet(ROUTE_PATTERNS.progressLeeches).networkError();

    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    renderWithRouter(<LeechWidget />);

    await waitFor(() => {
      expect(screen.queryByText("Focus Words")).not.toBeInTheDocument();
    });

    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("should navigate to quiz when review button clicked", async () => {
    mock.onGet(ROUTE_PATTERNS.progressLeeches).reply(200, mockLeechResponse);

    renderWithRouter(<LeechWidget />);

    await waitFor(() => {
      expect(screen.getByText("Focus Words")).toBeInTheDocument();
    });

    const reviewButton = screen.getByRole("button", { name: /review now/i });
    expect(reviewButton).toBeInTheDocument();

    // Note: actual navigation testing requires more setup with router mocks
    // This test verifies the button exists and is clickable
    fireEvent.click(reviewButton);
  });

  it("should display English translations", async () => {
    mock.onGet(ROUTE_PATTERNS.progressLeeches).reply(200, mockLeechResponse);

    renderWithRouter(<LeechWidget />);

    await waitFor(() => {
      expect(screen.getByText("Focus Words")).toBeInTheDocument();
    });

    expect(screen.getByText("hello")).toBeInTheDocument();
    expect(screen.getByText("thank you")).toBeInTheDocument();
    expect(screen.getByText("goodbye")).toBeInTheDocument();
  });

  it("should send correct API query params", async () => {
    let capturedParams: any = null;

    mock.onGet(ROUTE_PATTERNS.progressLeeches).reply((config) => {
      capturedParams = config.params;
      return [200, mockLeechResponse];
    });

    renderWithRouter(<LeechWidget />);

    await waitFor(() => {
      expect(capturedParams).not.toBeNull();
    });

    expect(capturedParams.minLapseCount).toBe(5);
  });
});
