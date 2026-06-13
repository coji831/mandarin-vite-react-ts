/**
 * Tests for Gamification API Hooks
 * Story 15.9: Gamification & AI Integration
 *
 * Tests useFetchStreak, useFetchBadges, and useSpendFreeze hooks with:
 * - Successful requests
 * - Error handling
 * - Loading states
 * - Response validation
 */

import { renderHook, waitFor } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import { apiClient } from "../../../../shared/api/axiosClient";
import {
  StreakResponse,
  BadgeResponse,
  FreezeResponse,
  useFetchStreak,
  useFetchBadges,
  useSpendFreeze,
} from "../useGamificationAPI";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";

// ============================================================================
// Mock Setup
// ============================================================================

const mock = new MockAdapter(apiClient);

const mockStreakResponse: StreakResponse = {
  currentStreak: 7,
  longestStreak: 12,
  freezeCount: 3,
  lastActivityDate: "2026-02-15T08:00:00.000Z",
};

const mockBadgeResponse: BadgeResponse = {
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
    {
      id: "gold_flame",
      name: "Gold Flame",
      streakRequired: 100,
      icon: "🔥",
      progress: 7,
      percentComplete: 7,
    },
  ],
};

const mockFreezeResponse: FreezeResponse = {
  message: "Freeze spent successfully",
  freezeCount: 2,
  lastActivityDate: "2026-02-14T08:00:00.000Z",
};

// ============================================================================
// Tests: useFetchStreak
// ============================================================================

describe("useFetchStreak", () => {
  beforeEach(() => {
    mock.reset();
  });

  afterEach(() => {
    mock.reset();
  });

  it("should initialize with loading=false and error=null", () => {
    const { result } = renderHook(() => useFetchStreak());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it("should fetch streak data successfully", async () => {
    mock.onGet(ROUTE_PATTERNS.progressStreak).reply(200, mockStreakResponse);

    const { result } = renderHook(() => useFetchStreak());

    const data = await result.current.fetchStreak();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(data).toEqual(mockStreakResponse);
    expect(data.currentStreak).toBe(7);
    expect(data.longestStreak).toBe(12);
    expect(data.freezeCount).toBe(3);
    expect(data.lastActivityDate).toBe("2026-02-15T08:00:00.000Z");
    expect(result.current.error).toBe(null);
  });

  it("should handle loading state during fetch", async () => {
    mock.onGet(ROUTE_PATTERNS.progressStreak).reply(() => {
      return new Promise((resolve) => {
        setTimeout(() => resolve([200, mockStreakResponse]), 50);
      });
    });

    const { result } = renderHook(() => useFetchStreak());

    result.current.fetchStreak();

    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it("should handle 401 authentication errors", async () => {
    mock.onGet(ROUTE_PATTERNS.progressStreak).reply(401, { error: "Unauthorized" });

    const { result } = renderHook(() => useFetchStreak());

    await expect(result.current.fetchStreak()).rejects.toThrow();

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.loading).toBe(false);
    });
  });

  it("should handle 500 server errors", async () => {
    mock.onGet(ROUTE_PATTERNS.progressStreak).reply(500, { error: "Internal Server Error" });

    const { result } = renderHook(() => useFetchStreak());

    await expect(result.current.fetchStreak()).rejects.toThrow();

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.loading).toBe(false);
    });
  });

  it("should handle network errors gracefully", async () => {
    mock.onGet(ROUTE_PATTERNS.progressStreak).networkError();

    const { result } = renderHook(() => useFetchStreak());

    await expect(result.current.fetchStreak()).rejects.toThrow();

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.loading).toBe(false);
    });
  });

  it("should return default streak data when backend returns empty", async () => {
    const emptyResponse: StreakResponse = {
      currentStreak: 0,
      longestStreak: 0,
      freezeCount: 0,
      lastActivityDate: "2026-02-15T08:00:00.000Z",
    };

    mock.onGet(ROUTE_PATTERNS.progressStreak).reply(200, emptyResponse);

    const { result } = renderHook(() => useFetchStreak());

    const data = await result.current.fetchStreak();

    expect(data).toEqual(emptyResponse);
    expect(data.currentStreak).toBe(0);
    expect(data.longestStreak).toBe(0);
    expect(data.freezeCount).toBe(0);
  });
});

// ============================================================================
// Tests: useFetchBadges
// ============================================================================

describe("useFetchBadges", () => {
  beforeEach(() => {
    mock.reset();
  });

  afterEach(() => {
    mock.reset();
  });

  it("should initialize with loading=false and error=null", () => {
    const { result } = renderHook(() => useFetchBadges());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it("should fetch badge data successfully", async () => {
    mock.onGet(ROUTE_PATTERNS.gamificationBadges).reply(200, mockBadgeResponse);

    const { result } = renderHook(() => useFetchBadges());

    const data = await result.current.fetchBadges();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(data).toEqual(mockBadgeResponse);
    expect(data.earned).toHaveLength(1);
    expect(data.earned[0].id).toBe("bronze_flame");
    expect(data.earned[0].earnedDate).toBe("2026-02-08T10:00:00.000Z");
    expect(data.available).toHaveLength(2);
    expect(data.available[0].progress).toBe(7);
    expect(data.available[0].percentComplete).toBe(23);
    expect(result.current.error).toBe(null);
  });

  it("should handle loading state during fetch", async () => {
    mock.onGet(ROUTE_PATTERNS.gamificationBadges).reply(() => {
      return new Promise((resolve) => {
        setTimeout(() => resolve([200, mockBadgeResponse]), 50);
      });
    });

    const { result } = renderHook(() => useFetchBadges());

    result.current.fetchBadges();

    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it("should handle 401 authentication errors", async () => {
    mock.onGet(ROUTE_PATTERNS.gamificationBadges).reply(401, { error: "Unauthorized" });

    const { result } = renderHook(() => useFetchBadges());

    await expect(result.current.fetchBadges()).rejects.toThrow();

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.loading).toBe(false);
    });
  });

  it("should handle no badges earned yet", async () => {
    const noBadgesResponse: BadgeResponse = {
      earned: [],
      available: [
        {
          id: "bronze_flame",
          name: "Bronze Flame",
          streakRequired: 7,
          icon: "🔥",
          progress: 3,
          percentComplete: 43,
        },
      ],
    };

    mock.onGet(ROUTE_PATTERNS.gamificationBadges).reply(200, noBadgesResponse);

    const { result } = renderHook(() => useFetchBadges());

    const data = await result.current.fetchBadges();

    expect(data).toEqual(noBadgesResponse);
    expect(data.earned).toHaveLength(0);
    expect(data.available).toHaveLength(1);
  });

  it("should handle network errors gracefully", async () => {
    mock.onGet(ROUTE_PATTERNS.gamificationBadges).networkError();

    const { result } = renderHook(() => useFetchBadges());

    await expect(result.current.fetchBadges()).rejects.toThrow();

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.loading).toBe(false);
    });
  });
});

// ============================================================================
// Tests: useSpendFreeze
// ============================================================================

describe("useSpendFreeze", () => {
  beforeEach(() => {
    mock.reset();
  });

  afterEach(() => {
    mock.reset();
  });

  it("should initialize with loading=false and error=null", () => {
    const { result } = renderHook(() => useSpendFreeze());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it("should spend freeze successfully", async () => {
    mock.onPost(ROUTE_PATTERNS.progressStreakFreeze).reply(200, mockFreezeResponse);

    const { result } = renderHook(() => useSpendFreeze());

    const data = await result.current.spendFreeze();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(data).toEqual(mockFreezeResponse);
    expect(data.message).toBe("Freeze spent successfully");
    expect(data.freezeCount).toBe(2);
    expect(result.current.error).toBe(null);
  });

  it("should handle loading state during POST", async () => {
    mock.onPost(ROUTE_PATTERNS.progressStreakFreeze).reply(() => {
      return new Promise((resolve) => {
        setTimeout(() => resolve([200, mockFreezeResponse]), 50);
      });
    });

    const { result } = renderHook(() => useSpendFreeze());

    result.current.spendFreeze();

    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it("should handle 400 error when no freezes available", async () => {
    mock.onPost(ROUTE_PATTERNS.progressStreakFreeze).reply(400, { error: "No freezes available" });

    const { result } = renderHook(() => useSpendFreeze());

    await expect(result.current.spendFreeze()).rejects.toThrow();

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.loading).toBe(false);
    });
  });

  it("should handle 400 error when streak not at risk", async () => {
    mock
      .onPost(ROUTE_PATTERNS.progressStreakFreeze)
      .reply(400, { error: "Streak not at risk (within 48h grace period)" });

    const { result } = renderHook(() => useSpendFreeze());

    await expect(result.current.spendFreeze()).rejects.toThrow();

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.loading).toBe(false);
    });
  });

  it("should handle 401 authentication errors", async () => {
    mock.onPost(ROUTE_PATTERNS.progressStreakFreeze).reply(401, { error: "Unauthorized" });

    const { result } = renderHook(() => useSpendFreeze());

    await expect(result.current.spendFreeze()).rejects.toThrow();

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.loading).toBe(false);
    });
  });

  it("should handle network errors gracefully", async () => {
    mock.onPost(ROUTE_PATTERNS.progressStreakFreeze).networkError();

    const { result } = renderHook(() => useSpendFreeze());

    await expect(result.current.spendFreeze()).rejects.toThrow();

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.loading).toBe(false);
    });
  });

  it("should handle 500 server errors", async () => {
    mock
      .onPost(ROUTE_PATTERNS.progressStreakFreeze)
      .reply(500, { error: "Failed to spend freeze" });

    const { result } = renderHook(() => useSpendFreeze());

    await expect(result.current.spendFreeze()).rejects.toThrow();

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.loading).toBe(false);
    });
  });
});
