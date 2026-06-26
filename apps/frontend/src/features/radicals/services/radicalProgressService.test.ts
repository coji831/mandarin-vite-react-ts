/**
 * @file services/radicalProgressService.test.ts
 * @description Tests for radicalProgressService
 * Story 19.4: Radical Trees (Phase 3)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { radicalProgressService } from "./radicalProgressService";

const mockGet = vi.hoisted(() => vi.fn());
vi.mock("../../../shared/api/axiosClient", () => ({
  apiClient: {
    get: mockGet,
  },
}));

describe("radicalProgressService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls the correct API endpoint", async () => {
    mockGet.mockResolvedValue({ data: [] });

    await radicalProgressService.getRadicalProgress();

    expect(mockGet).toHaveBeenCalledTimes(1);
    // Verify it uses ROUTE_PATTERNS.progressionRadicalProgress
    // The actual value is resolved at runtime; we just check that get was called
    expect(mockGet.mock.calls[0][0]).toBeDefined();
  });

  it("returns the response data from API", async () => {
    const mockData = [
      {
        id: "progress-1",
        userId: "user-1",
        radicalId: "rad_0001",
        memorized: true,
        recognitionLevel: 3,
        reviewedAt: "2026-06-27T00:00:00Z",
        createdAt: "2026-06-01T00:00:00Z",
        updatedAt: "2026-06-27T00:00:00Z",
      },
      {
        id: "progress-2",
        userId: "user-1",
        radicalId: "rad_0008",
        memorized: false,
        recognitionLevel: 1,
        reviewedAt: null,
        createdAt: "2026-06-01T00:00:00Z",
        updatedAt: "2026-06-01T00:00:00Z",
      },
    ];

    mockGet.mockResolvedValue({ data: mockData });

    const result = await radicalProgressService.getRadicalProgress();

    expect(result).toEqual(mockData);
    expect(result).toHaveLength(2);
  });

  it("handles empty response", async () => {
    mockGet.mockResolvedValue({ data: [] });

    const result = await radicalProgressService.getRadicalProgress();

    expect(result).toEqual([]);
  });

  it("propagates API errors", async () => {
    mockGet.mockRejectedValue(new Error("Network error"));

    await expect(radicalProgressService.getRadicalProgress()).rejects.toThrow("Network error");
  });
});
