import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { WordExamplesPanel } from "../components/WordExamplesPanel";
import * as examplesApi from "../services/examplesApi";
import * as analyticsService from "../services/analyticsService";
import * as useExamplesHook from "../hooks/useExamples";
import { AudioService } from "../services";

describe("WordExamplesPanel", () => {
  const mockExamples = [
    { chinese: "我吃饭", pinyin: "wǒ chī fàn", english: "I eat" },
    { chinese: "他喝水", pinyin: "tā hē shuǐ", english: "He drinks water" },
  ];

  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
    // Ensure module-level in-flight dedupe map is cleared between tests
    useExamplesHook._clearInFlightPromisesForTests();
  });

  it("renders skeleton while loading", () => {
    vi.spyOn(examplesApi, "fetchExamples").mockImplementation(() => new Promise(() => {})); // never resolves

    render(<WordExamplesPanel wordId="test-word-id" word="饭" hskLevel={1} language="en" />);

    const skeletonItems = screen.getAllByRole("listitem");
    expect(skeletonItems.length).toBeGreaterThan(0);
    expect(skeletonItems[0]).toHaveClass("skeleton-item");
  });

  it("renders examples when loaded", async () => {
    vi.spyOn(examplesApi, "fetchExamples").mockResolvedValue(mockExamples as any);

    render(<WordExamplesPanel wordId="test-word-id" word="饭" hskLevel={1} language="en" />);

    await waitFor(() => {
      expect(screen.getByText("我吃饭")).toBeInTheDocument();
      expect(screen.getByText("他喝水")).toBeInTheDocument();
    });
  });

  it("renders error state on fetch failure", async () => {
    vi.spyOn(examplesApi, "fetchExamples").mockRejectedValue(new Error("Network error"));

    render(<WordExamplesPanel wordId="test-word-id" word="饭" hskLevel={1} language="en" />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load examples/)).toBeInTheDocument();
    });
  });

  it("plays audio when example clicked", async () => {
    vi.spyOn(examplesApi, "fetchExamples").mockResolvedValue(mockExamples as any);
    // Mock cache key generation and backend example audio fetch
    vi.spyOn(examplesApi, "getCacheKey").mockResolvedValue("cache-key-1" as any);
    const fetchExampleSpy = vi
      .spyOn(AudioService.prototype, "fetchExampleAudio")
      .mockResolvedValue({ audio_url: "data:audio/wav;base64,xxx" } as any);
    // Mock browser Audio to simulate playback
    const MockAudio = function (this: any, src?: string) {
      this.src = src;
      this.onended = null;
      this.play = vi.fn().mockImplementation(() => {
        if (this.onended) this.onended();
        return Promise.resolve();
      });
      this.pause = vi.fn();
    } as any;
    global.Audio = MockAudio;

    render(<WordExamplesPanel wordId="test-word-id" word="饭" hskLevel={1} language="en" />);

    await waitFor(() => {
      expect(screen.getByText("我吃饭")).toBeInTheDocument();
    });

    // Click the first example list item (now clickable instead of separate button)
    const firstExample = screen.getByRole("listitem", { name: /Example 1: 我吃饭/ });
    fireEvent.click(firstExample);

    await waitFor(() => {
      expect(fetchExampleSpy).toHaveBeenCalled();
    });
  });

  it("tracks analytics events", async () => {
    vi.spyOn(examplesApi, "fetchExamples").mockResolvedValue(mockExamples as any);
    vi.spyOn(examplesApi, "getCacheKey").mockResolvedValue("cache-key-1" as any);
    const fetchExampleSpy = vi
      .spyOn(AudioService.prototype, "fetchExampleAudio")
      .mockResolvedValue({ audio_url: "data:audio/wav;base64,xxx" } as any);
    const MockAudio = function (this: any, src?: string) {
      this.src = src;
      this.onended = null;
      this.play = vi.fn().mockImplementation(() => {
        if (this.onended) this.onended();
        return Promise.resolve();
      });
      this.pause = vi.fn();
    } as any;
    global.Audio = MockAudio;
    vi.spyOn(analyticsService, "trackExamplesShown").mockImplementation(() => {});
    vi.spyOn(analyticsService, "trackExamplePlayed").mockImplementation(() => {});

    render(<WordExamplesPanel wordId="test-word-id" word="饭" hskLevel={1} language="en" />);

    await waitFor(() => {
      expect(analyticsService.trackExamplesShown).toHaveBeenCalledWith(false);
    });

    const firstExample = screen.getByRole("listitem", { name: /Example 1: 我吃饭/ });
    fireEvent.click(firstExample);

    await waitFor(() => {
      expect(fetchExampleSpy).toHaveBeenCalled();
      expect(analyticsService.trackExamplePlayed).toHaveBeenCalledWith(0, false);
    });
  });

  it('renders max 5 examples with "Show more" button', async () => {
    const manyExamples = Array.from({ length: 8 }, (_, i) => ({
      chinese: `例${i + 1}`,
      pinyin: `lì ${i + 1}`,
      english: `Example ${i + 1}`,
    }));

    vi.spyOn(examplesApi, "fetchExamples").mockResolvedValue(manyExamples as any);

    render(<WordExamplesPanel wordId="test-word-id" word="多" hskLevel={1} language="en" />);

    await waitFor(() => {
      const items = screen.getAllByRole("listitem");
      expect(items).toHaveLength(5); // Only 5 shown initially
      expect(screen.getByRole("button", { name: /Show 3 more/ })).toBeInTheDocument();
    });
  });

  it("renders examples within 500ms on cached payload", async () => {
    // Simulate cached path by stubbing getCacheKey and priming sessionStorage
    const cacheKey = "cached-key-123";
    vi.spyOn(examplesApi, "getCacheKey").mockResolvedValue(cacheKey as any);
    sessionStorage.setItem(`examples_${cacheKey}`, JSON.stringify(mockExamples));

    const startTime = performance.now();
    // fetchExamples should not be called when cached
    vi.spyOn(examplesApi, "fetchExamples").mockResolvedValue(mockExamples as any);

    render(<WordExamplesPanel wordId="test-word-id" word="饭" hskLevel={1} language="en" />);

    await waitFor(() => {
      expect(screen.getByText("我吃饭")).toBeInTheDocument();
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(500);
    });
  });

  it("is keyboard accessible", async () => {
    vi.spyOn(examplesApi, "fetchExamples").mockResolvedValue(mockExamples as any);

    render(<WordExamplesPanel wordId="test-word-id" word="饭" hskLevel={1} language="en" />);

    await waitFor(() => {
      expect(screen.getByText("我吃饭")).toBeInTheDocument();
    });

    const firstExample = screen.getByRole("listitem", { name: /Example 1: 我吃饭/ });
    expect(firstExample).toBeTruthy();
    // Ensure it can receive focus (list items with tabindex=0 are focusable)
    firstExample.focus();
    expect(document.activeElement).toBe(firstExample);
  });
});
