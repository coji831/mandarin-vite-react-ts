/**
 * @file pages/learn/foundations/__tests__/FoundationsPage.test.tsx
 * @description Tests for FoundationsPage — locked-tab unlock-phase tooltip
 * (WCAG), plus Story 22.4 follow-up (Issue 4) URL seeding: `?tab=` deep-links
 * seed the active tab (URL wins over the `initialTab` default).
 *
 * NOTE: vitest config uses `mockReset: true`, so mock implementations must be
 * set in beforeEach (after the per-test reset), not in the vi.mock factory.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { FoundationsPage } from "../FoundationsPage";
import { foundationsService } from "features/foundations";

// PinyinTab mounts the shared usePinyinCharacterMap hook (a real fetch). This
// test has no MSW, so stub it with a resolved empty map to stay hermetic.
vi.mock("shared/hooks", async () => {
  const actual = await vi.importActual("shared/hooks");
  return {
    ...actual,
    usePinyinCharacterMap: () => ({ charMap: {}, isLoading: false, error: null }),
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

/** Renders inside a router so useSearchParamState can read/write ?tab=. */
function renderFoundations(initialEntry = "/learn/foundations") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <FoundationsPage />
    </MemoryRouter>,
  );
}

describe("FoundationsPage", () => {
  beforeEach(() => {
    // getFoundationProgress → [] keeps Tones uncompleted → Pictographs tab locked.
    vi.mocked(foundationsService.getFoundationProgress).mockResolvedValue([]);
    // Tab content (PinyinTab) settles into its loading screen — harmless.
    vi.mocked(foundationsService.getPinyinTonesPool).mockResolvedValue(null as never);
    vi.mocked(foundationsService.getPinyinCharacterMap).mockResolvedValue({});
    vi.mocked(foundationsService.getStrokesReference).mockResolvedValue(null as never);
  });
  it("shows the unlock-phase tooltip on the locked Pictographs tab", async () => {
    renderFoundations();

    const pictographsTab = await screen.findByRole("tab", { name: /pictographs/i });

    expect(pictographsTab).toBeDisabled();
    expect(pictographsTab).toHaveAttribute("title", "Complete Phase 2 to unlock");
  });

  it("does not show an unlock tooltip on unlocked tabs", async () => {
    renderFoundations();

    const pinyinTab = await screen.findByRole("tab", { name: /pinyin/i });

    expect(pinyinTab).not.toBeDisabled();
    expect(pinyinTab).not.toHaveAttribute("title");
  });

  it("defaults to the pinyin tab when no ?tab= is present", async () => {
    renderFoundations();
    const pinyinTab = await screen.findByRole("tab", { name: /pinyin/i });
    expect(pinyinTab).toHaveAttribute("aria-selected", "true");
  });

  it("seeds the active tab from ?tab= (URL wins over the default)", async () => {
    renderFoundations("/learn/foundations?tab=tones");
    const tonesTab = await screen.findByRole("tab", { name: /tones/i });
    expect(tonesTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: /pinyin/i })).toHaveAttribute("aria-selected", "false");
  });
});
