/**
 * @file hooks/__tests__/useAutoSaveProgress.test.ts
 * @description Tests for useAutoSaveProgress (debounced auto-save hook).
 * Story 21.7: Reading Progress
 *
 * Tests cover: no-op when sentence unchanged, debounced save on change,
 * timer reset on rapid changes, save on unmount, beforeunload listener.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useReadingStore } from "../../stores/readingStore";
import { useAutoSaveProgress } from "../useAutoSaveProgress";

// Mock the readingProgressService (used by readingStore.saveProgress)
vi.mock("../../services/readingProgressService", () => ({
  readingProgressService: {
    updatePosition: vi.fn(),
  },
}));

const DEBOUNCE_MS = 2000;

describe("useAutoSaveProgress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    useReadingStore.setState(useReadingStore.getInitialState());
    // Set authenticated + a valid passage so saveProgress is actionable
    useReadingStore.setState({
      isAuthenticated: true,
      currentPassageId: "p1",
      currentSentence: 0,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does NOT fire saveProgress when currentSentence hasn't changed", () => {
    const saveSpy = vi.spyOn(useReadingStore.getState(), "saveProgress");

    renderHook(() => useAutoSaveProgress());

    // Advance time without changing currentSentence
    vi.advanceTimersByTime(DEBOUNCE_MS + 100);

    expect(saveSpy).not.toHaveBeenCalled();
  });

  it("fires saveProgress after debounce delay when currentSentence changes", () => {
    const saveSpy = vi.spyOn(useReadingStore.getState(), "saveProgress");

    renderHook(() => useAutoSaveProgress());

    // Change sentence to trigger debounce
    useReadingStore.setState({ currentSentence: 3 });

    // Not yet fired before debounce
    vi.advanceTimersByTime(DEBOUNCE_MS - 100);
    expect(saveSpy).not.toHaveBeenCalled();

    // Now past debounce threshold
    vi.advanceTimersByTime(200);
    expect(saveSpy).toHaveBeenCalledTimes(1);
  });

  it("resets debounce timer on rapid changes", () => {
    const saveSpy = vi.spyOn(useReadingStore.getState(), "saveProgress");

    renderHook(() => useAutoSaveProgress());

    // Rapidly change sentence multiple times
    useReadingStore.setState({ currentSentence: 1 });
    vi.advanceTimersByTime(500);

    useReadingStore.setState({ currentSentence: 2 });
    vi.advanceTimersByTime(500);

    useReadingStore.setState({ currentSentence: 3 });
    vi.advanceTimersByTime(500);

    // Only 1500ms elapsed since last change — debounce hasn't fired yet
    expect(saveSpy).not.toHaveBeenCalled();

    // Advance past remaining debounce
    vi.advanceTimersByTime(DEBOUNCE_MS);
    expect(saveSpy).toHaveBeenCalledTimes(1);
  });

  it("calls saveProgress on unmount", () => {
    const saveSpy = vi.spyOn(useReadingStore.getState(), "saveProgress");

    const { unmount } = renderHook(() => useAutoSaveProgress());

    unmount();

    expect(saveSpy).toHaveBeenCalledTimes(1);
  });

  it("registers beforeunload listener", () => {
    const addEventListenerSpy = vi.spyOn(window, "addEventListener");
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = renderHook(() => useAutoSaveProgress());

    expect(addEventListenerSpy).toHaveBeenCalledWith("beforeunload", expect.any(Function));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith("beforeunload", expect.any(Function));
  });

  it("does NOT save when not authenticated", () => {
    useReadingStore.setState({ isAuthenticated: false });
    const saveSpy = vi.spyOn(useReadingStore.getState(), "saveProgress");

    renderHook(() => useAutoSaveProgress());

    // Change sentence
    useReadingStore.setState({ currentSentence: 3 });
    vi.advanceTimersByTime(DEBOUNCE_MS + 100);

    // saveProgress itself is a no-op when !isAuthenticated, but the hook
    // should not even schedule the debounce callback
    expect(saveSpy).not.toHaveBeenCalled();
  });
});
