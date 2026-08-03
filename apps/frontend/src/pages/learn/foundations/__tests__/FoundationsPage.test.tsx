/**
 * @file pages/learn/foundations/__tests__/FoundationsPage.test.tsx
 * @description Tests for FoundationsPage — locked-tab unlock-phase tooltip (WCAG).
 * VisFix W4: locked tabs now expose WHICH phase unlocks them via the `title`
 * tooltip rendered by the shared <Tabs> component (getLockPhase → "Complete
 * Phase 2 to unlock").
 *
 * NOTE: vitest config uses `mockReset: true`, so mock implementations must be
 * set in beforeEach (after the per-test reset), not in the vi.mock factory.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
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
    render(<FoundationsPage />);

    const pictographsTab = await screen.findByRole("tab", { name: /pictographs/i });

    expect(pictographsTab).toBeDisabled();
    expect(pictographsTab).toHaveAttribute("title", "Complete Phase 2 to unlock");
  });

  it("does not show an unlock tooltip on unlocked tabs", async () => {
    render(<FoundationsPage />);

    const pinyinTab = await screen.findByRole("tab", { name: /pinyin/i });

    expect(pinyinTab).not.toBeDisabled();
    expect(pinyinTab).not.toHaveAttribute("title");
  });
});
