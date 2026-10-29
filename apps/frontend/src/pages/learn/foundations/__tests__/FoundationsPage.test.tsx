/**
 * @file pages/learn/foundations/__tests__/FoundationsPage.test.tsx
 * @description Tests for the Blueprint (`/learn/foundations`, §3): the first-run
 * path is ONE sequential task — a seven-step wizard with a stepper, one primary
 * Continue at the bottom of each step, and no tab bar of sibling references.
 *
 * NOTE: vitest config uses `mockReset: true`, so mock implementations must be
 * set in beforeEach (after the per-test reset), not in the vi.mock factory.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { FoundationsPage } from "../FoundationsPage";
import { BLUEPRINT_STEPS, foundationsService } from "features/foundations";

// The Blueprint resolves pinyin→Hanzi for its audio; stub the shared map so the
// test stays hermetic (no MSW here).
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

// The radical step reads the radical list; the pinyin steps do not need it.
// (The factory is reset by vitest's `mockReset: true`, so the resolved value is
// set in beforeEach below.)
vi.mock("features/radicals", async () => {
  const actual = await vi.importActual<typeof import("features/radicals")>("features/radicals");
  return {
    ...actual,
    radicalsService: { loadAllRadicals: vi.fn() },
  };
});

const POOL = {
  initials: [
    { id: "init_b", pinyin: "b", ipa: "[p]", description: "unaspirated p" },
    { id: "init_p", pinyin: "p", ipa: "[pʰ]", description: "aspirated p" },
  ],
  finals: [{ id: "fin_a", pinyin: "a", type: "simple", description: "open a" }],
  combinations: [{ initial: "b", final: "a", tones: ["ba1", "ba2", null, null, null] }],
  toneInfo: [
    {
      number: 1,
      name: "First Tone",
      mark: "ˉ",
      pinyinExample: "mā",
      chineseExample: "妈",
      description: "High level",
      contour: [5, 5, 5],
      color: "#f00",
    },
  ],
  tonePairs: [],
  toneRules: [],
};

function renderBlueprint(initialEntry = "/learn/foundations") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <FoundationsPage />
    </MemoryRouter>,
  );
}

describe("FoundationsPage (the Blueprint)", () => {
  beforeEach(async () => {
    vi.mocked(foundationsService.getFoundationProgress).mockResolvedValue([]);
    vi.mocked(foundationsService.getPinyinTonesPool).mockResolvedValue(POOL as never);
    vi.mocked(foundationsService.getPinyinCharacterMap).mockResolvedValue({});
    vi.mocked(foundationsService.getStrokesReference).mockResolvedValue(null as never);
    const { radicalsService } = await import("features/radicals");
    vi.mocked(radicalsService.loadAllRadicals).mockResolvedValue([]);
  });

  it("renders the first step as a single task with a stepper", async () => {
    renderBlueprint();

    expect(
      await screen.findByRole("heading", { level: 1, name: BLUEPRINT_STEPS[0].title }),
    ).toBeInTheDocument();
    expect(screen.getByText(`Step 1 of ${BLUEPRINT_STEPS.length}`)).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Blueprint steps" })).toBeInTheDocument();
    // The current step is announced, not merely coloured.
    expect(screen.getByRole("button", { name: /Initials/ })).toHaveAttribute(
      "aria-current",
      "step",
    );
  });

  it("has no tab bar — the reference is a separate route", () => {
    renderBlueprint();
    expect(screen.queryByRole("tab")).toBeNull();
    expect(screen.getByRole("button", { name: /See every initial, final, tone and stroke/i }));
  });

  it("advances one step per Continue press", async () => {
    renderBlueprint();
    await screen.findByRole("heading", { level: 1, name: BLUEPRINT_STEPS[0].title });

    await userEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(
      screen.getByRole("heading", { level: 1, name: BLUEPRINT_STEPS[1].title }),
    ).toBeInTheDocument();
    expect(screen.getByText(`Step 2 of ${BLUEPRINT_STEPS.length}`)).toBeInTheDocument();
  });

  it("offers Back only once past the first step", async () => {
    renderBlueprint();
    await screen.findByRole("heading", { level: 1, name: BLUEPRINT_STEPS[0].title });
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
  });

  it("ends with the Blueprint's last step and its completion CTA", async () => {
    renderBlueprint();
    await screen.findByRole("heading", { level: 1, name: BLUEPRINT_STEPS[0].title });

    for (let i = 1; i < BLUEPRINT_STEPS.length; i += 1) {
      await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    }

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: BLUEPRINT_STEPS[BLUEPRINT_STEPS.length - 1].title,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Finish the Blueprint" })).toBeInTheDocument();
  });
});
