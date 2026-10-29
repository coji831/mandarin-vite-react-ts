/**
 * @file pages/learn/foundations/__tests__/FoundationsReferencePage.test.tsx
 * @description Tests for the dense reference index (`/learn/foundations/reference`).
 * The contract this pins (§1 + §3):
 *  - NO tab is locked — the old "Complete Phase 2 to unlock" gate on the
 *    Pictographs tab is gone (a lock that clicks through teaches the learner to
 *    distrust the chrome).
 *  - the active tab is URL-driven (`?tab=`) and a deep link wins.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { FoundationsReferencePage } from "../FoundationsReferencePage";
import { foundationsService } from "features/foundations";

vi.mock("shared/hooks", async () => {
  const actual = await vi.importActual("shared/hooks");
  return {
    ...actual,
    usePinyinCharacterMap: () => ({ charMap: {}, isLoading: false, error: null }),
    useAudioItemPlayback: () => ({ play: vi.fn(), isPlaying: false, isLoading: false }),
  };
});

vi.mock("../../../../features/foundations/services/foundationsService", () => ({
  foundationsService: {
    getFoundationProgress: vi.fn(),
    getPinyinTonesPool: vi.fn(),
    getPinyinCharacterMap: vi.fn(),
    getStrokesReference: vi.fn(),
  },
}));

function renderReference(initialEntry = "/learn/foundations/reference") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <FoundationsReferencePage />
    </MemoryRouter>,
  );
}

describe("FoundationsReferencePage", () => {
  beforeEach(() => {
    vi.mocked(foundationsService.getFoundationProgress).mockResolvedValue([]);
    vi.mocked(foundationsService.getPinyinTonesPool).mockResolvedValue(null as never);
    vi.mocked(foundationsService.getPinyinCharacterMap).mockResolvedValue({});
    vi.mocked(foundationsService.getStrokesReference).mockResolvedValue(null as never);
  });

  it("renders every reference tab unlocked, including Pictographs", async () => {
    renderReference();

    const pictographsTab = await screen.findByRole("tab", { name: /pictographs/i });
    expect(pictographsTab).toBeEnabled();
    expect(pictographsTab).not.toHaveAttribute("title", "Complete Phase 2 to unlock");

    for (const tab of screen.getAllByRole("tab")) {
      expect(tab).toBeEnabled();
    }
  });

  it("defaults to the pinyin tab", async () => {
    renderReference();
    const pinyinTab = await screen.findByRole("tab", { name: /pinyin/i });
    expect(pinyinTab).toHaveAttribute("aria-selected", "true");
  });

  it("seeds the active tab from ?tab= (URL wins over the default)", async () => {
    renderReference("/learn/foundations/reference?tab=pictographs");

    const pictographsTab = await screen.findByRole("tab", { name: /pictographs/i });
    expect(pictographsTab).toHaveAttribute("aria-selected", "true");
  });
});
