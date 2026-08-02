/**
 * @file stores/__tests__/readingStore.test.ts
 * @description Tests for readingStore (Zustand)
 * Story 21.4: Reading UI + LexicalHub Phase 1
 * Story 21.7: Added progress tests — setCurrentSentence, markCompleted,
 *   toggleBookmark, saveProgress, restoreSession, fetchBookmarks.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { useReadingStore } from "../readingStore";

// Mock the readingProgressService
vi.mock("../../services/readingProgressService", () => ({
  readingProgressService: {
    getSession: vi.fn(),
    updatePosition: vi.fn(),
    completePassage: vi.fn(),
    listBookmarks: vi.fn(),
    addBookmark: vi.fn(),
    removeBookmarkByPassage: vi.fn(),
  },
}));

import { readingProgressService } from "../../services/readingProgressService";

describe("readingStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useReadingStore.setState(useReadingStore.getInitialState());
  });

  describe("initial state", () => {
    it("starts with null currentPassageId", () => {
      expect(useReadingStore.getState().currentPassageId).toBeNull();
    });

    it("starts in library mode", () => {
      expect(useReadingStore.getState().mode).toBe("library");
    });

    it("starts with closed popover", () => {
      const popover = useReadingStore.getState().popover;
      expect(popover.glyph).toBeNull();
      expect(popover.position).toBeNull();
    });

    // Story 21.7 progress defaults
    it("starts with currentSentence = 0", () => {
      expect(useReadingStore.getState().currentSentence).toBe(0);
    });

    it("starts with empty completedPassages", () => {
      expect(useReadingStore.getState().completedPassages.size).toBe(0);
    });

    it("starts with empty bookmarkedPassages", () => {
      expect(useReadingStore.getState().bookmarkedPassages.size).toBe(0);
    });

    it("starts with isAuthenticated = false", () => {
      expect(useReadingStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe("setPassageId", () => {
    it("sets the passage ID", () => {
      useReadingStore.getState().setPassageId("passage-1");
      expect(useReadingStore.getState().currentPassageId).toBe("passage-1");
    });

    it("resets passage ID to null", () => {
      useReadingStore.getState().setPassageId("passage-1");
      useReadingStore.getState().setPassageId(null);
      expect(useReadingStore.getState().currentPassageId).toBeNull();
    });
  });

  describe("setMode", () => {
    it("sets mode to reading", () => {
      useReadingStore.getState().setMode("reading");
      expect(useReadingStore.getState().mode).toBe("reading");
    });

    it("sets mode to library", () => {
      useReadingStore.getState().setMode("reading");
      useReadingStore.getState().setMode("library");
      expect(useReadingStore.getState().mode).toBe("library");
    });
  });

  describe("openPopover / closePopover", () => {
    it("opens popover with glyph and position from DOMRect", () => {
      const rect = {
        left: 100,
        bottom: 200,
        top: 150,
        right: 200,
        width: 100,
        height: 50,
        x: 100,
        y: 150,
        toJSON: () => ({}),
      } as DOMRect;

      useReadingStore.getState().openPopover("好", rect);

      const popover = useReadingStore.getState().popover;
      expect(popover.glyph).toBe("好");
      expect(popover.position).toEqual({ x: 100, y: 200 });
    });

    it("closes popover", () => {
      const rect = { left: 100, bottom: 200 } as DOMRect;
      useReadingStore.getState().openPopover("好", rect);
      useReadingStore.getState().closePopover();

      const popover = useReadingStore.getState().popover;
      expect(popover.glyph).toBeNull();
      expect(popover.position).toBeNull();
    });
  });

  // ── Story 21.7: Progress Tests ─────────────────────────────────────────

  describe("setIsAuthenticated", () => {
    it("sets authentication state", () => {
      useReadingStore.getState().setIsAuthenticated(true);
      expect(useReadingStore.getState().isAuthenticated).toBe(true);
    });

    it("clears authentication state", () => {
      useReadingStore.getState().setIsAuthenticated(true);
      useReadingStore.getState().setIsAuthenticated(false);
      expect(useReadingStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe("setCurrentSentence", () => {
    it("updates currentSentence", () => {
      useReadingStore.getState().setCurrentSentence(5);
      expect(useReadingStore.getState().currentSentence).toBe(5);
    });

    it("resets to 0", () => {
      useReadingStore.getState().setCurrentSentence(5);
      useReadingStore.getState().setCurrentSentence(0);
      expect(useReadingStore.getState().currentSentence).toBe(0);
    });
  });

  describe("markCompleted", () => {
    it("adds passage to completedPassages", () => {
      useReadingStore.getState().markCompleted("passage-1");
      expect(useReadingStore.getState().completedPassages.has("passage-1")).toBe(true);
    });

    it("calls completePassage API", async () => {
      useReadingStore.getState().markCompleted("passage-1");

      // Wait for the silent retry to trigger the API call
      await vi.waitFor(() => {
        expect(readingProgressService.completePassage).toHaveBeenCalledWith("passage-1");
      });
    });
  });

  describe("toggleBookmark", () => {
    it("adds bookmark when not bookmarked", () => {
      useReadingStore.getState().toggleBookmark("passage-1");
      expect(useReadingStore.getState().bookmarkedPassages.has("passage-1")).toBe(true);
    });

    it("removes bookmark when already bookmarked", () => {
      // Add first
      useReadingStore.getState().toggleBookmark("passage-1");
      expect(useReadingStore.getState().bookmarkedPassages.has("passage-1")).toBe(true);

      // Toggle off
      useReadingStore.getState().toggleBookmark("passage-1");
      expect(useReadingStore.getState().bookmarkedPassages.has("passage-1")).toBe(false);
    });

    it("calls addBookmark API when adding", async () => {
      useReadingStore.setState({ isAuthenticated: true });
      useReadingStore.getState().toggleBookmark("passage-1");

      await vi.waitFor(() => {
        expect(readingProgressService.addBookmark).toHaveBeenCalledWith("passage-1");
      });
    });

    it("calls removeBookmarkByPassage API when removing", async () => {
      useReadingStore.setState({ isAuthenticated: true });
      // Add first via direct state manipulation (avoid triggering API for add)
      useReadingStore.setState({
        bookmarkedPassages: new Set(["passage-1"]),
      });

      useReadingStore.getState().toggleBookmark("passage-1");

      await vi.waitFor(() => {
        expect(readingProgressService.removeBookmarkByPassage).toHaveBeenCalledWith("passage-1");
      });
    });

    it("reverts optimistic update on sync failure", async () => {
      useReadingStore.setState({ isAuthenticated: true });
      vi.mocked(readingProgressService.addBookmark).mockRejectedValueOnce(
        new Error("Network error"),
      );

      useReadingStore.getState().toggleBookmark("passage-1");

      // Wait for the revert to happen
      await vi.waitFor(() => {
        expect(useReadingStore.getState().bookmarkedPassages.has("passage-1")).toBe(false);
      });
    });
  });

  describe("saveProgress", () => {
    it("is a no-op when not authenticated", async () => {
      useReadingStore.setState({
        isAuthenticated: false,
        currentPassageId: "p1",
        currentSentence: 5,
      });
      await useReadingStore.getState().saveProgress();
      expect(readingProgressService.updatePosition).not.toHaveBeenCalled();
    });

    it("is a no-op when no passage selected", async () => {
      useReadingStore.setState({
        isAuthenticated: true,
        currentPassageId: null,
        currentSentence: 5,
      });
      await useReadingStore.getState().saveProgress();
      expect(readingProgressService.updatePosition).not.toHaveBeenCalled();
    });

    it("calls updatePosition when authenticated and passage selected", async () => {
      useReadingStore.setState({
        isAuthenticated: true,
        currentPassageId: "p1",
        currentSentence: 3,
      });
      await useReadingStore.getState().saveProgress();
      expect(readingProgressService.updatePosition).toHaveBeenCalledWith("p1", 3);
    });
  });

  describe("restoreSession", () => {
    it("is a no-op when not authenticated", async () => {
      useReadingStore.setState({ isAuthenticated: false });
      await useReadingStore.getState().restoreSession("p1");
      expect(readingProgressService.getSession).not.toHaveBeenCalled();
    });

    it("sets currentSentence from API response", async () => {
      useReadingStore.setState({ isAuthenticated: true });
      vi.mocked(readingProgressService.getSession).mockResolvedValue({
        currentSentence: 7,
        isCompleted: false,
      });

      await useReadingStore.getState().restoreSession("p1");
      expect(useReadingStore.getState().currentSentence).toBe(7);
    });

    it("adds to completedPassages when session is completed", async () => {
      useReadingStore.setState({ isAuthenticated: true });
      vi.mocked(readingProgressService.getSession).mockResolvedValue({
        currentSentence: 10,
        isCompleted: true,
      });

      await useReadingStore.getState().restoreSession("p1");
      expect(useReadingStore.getState().completedPassages.has("p1")).toBe(true);
    });

    it("falls back to 0 on API error", async () => {
      useReadingStore.setState({ isAuthenticated: true, currentSentence: 5 });
      vi.mocked(readingProgressService.getSession).mockRejectedValueOnce(
        new Error("Network error"),
      );

      await useReadingStore.getState().restoreSession("p1");
      expect(useReadingStore.getState().currentSentence).toBe(0);
    });
  });

  describe("fetchBookmarks", () => {
    it("is a no-op when not authenticated", async () => {
      useReadingStore.setState({ isAuthenticated: false });
      await useReadingStore.getState().fetchBookmarks();
      expect(readingProgressService.listBookmarks).not.toHaveBeenCalled();
    });

    it("populates bookmarkedPassages from API", async () => {
      useReadingStore.setState({ isAuthenticated: true });
      vi.mocked(readingProgressService.listBookmarks).mockResolvedValue({
        bookmarks: ["p1", "p3"],
      });

      await useReadingStore.getState().fetchBookmarks();
      expect(useReadingStore.getState().bookmarkedPassages.has("p1")).toBe(true);
      expect(useReadingStore.getState().bookmarkedPassages.has("p3")).toBe(true);
      expect(useReadingStore.getState().bookmarkedPassages.has("p2")).toBe(false);
    });
  });
});
