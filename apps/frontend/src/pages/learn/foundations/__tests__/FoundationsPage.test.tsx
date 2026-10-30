/**
 * @file pages/learn/foundations/__tests__/FoundationsPage.test.tsx
 * @description Tests for the Blueprint (`/learn/foundations`, §3): the first-run
 * path is ONE sequential task — a seven-step wizard with a stepper, one primary
 * Continue at the bottom of each step, and no tab bar of sibling references.
 *
 * Plus the entry model that keeps the walk from becoming a treadmill:
 *  - a returning learner resumes at the stored step instead of step 1;
 *  - `?step=` deep-links any step directly;
 *  - the stepper jumps forward (skip), it does not gate anything;
 *  - "Finish the Blueprint" records completion, which changes copy only;
 *  - the reference is one link away from every step.
 *
 * NOTE: vitest config uses `mockReset: true`, so mock implementations must be
 * set in beforeEach (after the per-test reset), not in the vi.mock factory.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { FoundationsPage } from "../FoundationsPage";
import {
  BLUEPRINT_STEPS,
  clearBlueprintPosition,
  foundationsService,
  readBlueprintPosition,
  writeBlueprintPosition,
} from "features/foundations";

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

/** Renders the current URL so a navigation can be asserted. */
function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname + location.search}</div>;
}

function renderBlueprint(initialEntry = "/learn/foundations") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <FoundationsPage />
      <LocationProbe />
    </MemoryRouter>,
  );
}

describe("FoundationsPage (the Blueprint)", () => {
  beforeEach(async () => {
    // localStorage survives between tests in jsdom — the position must not.
    clearBlueprintPosition();
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

  it("has no tab bar — the reference is a separate route, one link from every step", async () => {
    renderBlueprint();
    await screen.findByRole("heading", { level: 1, name: BLUEPRINT_STEPS[0].title });

    expect(screen.queryByRole("tab")).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Reference" }));
    expect(screen.getByTestId("location")).toHaveTextContent("/learn/foundations/reference");
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

  /** ENTRY MODEL — the walk must never trap a learner on step 1 again. */
  describe("entry model (a first-run guide, not a treadmill)", () => {
    it("lets the stepper skip ahead — no step is disabled", async () => {
      renderBlueprint();
      await screen.findByRole("heading", { level: 1, name: BLUEPRINT_STEPS[0].title });

      const stepper = screen.getByRole("navigation", { name: "Blueprint steps" });
      for (const button of within(stepper).getAllByRole("button")) {
        expect(button).toBeEnabled();
      }

      await userEvent.click(within(stepper).getByRole("button", { name: "Radicals" }));

      const radicalsStep = BLUEPRINT_STEPS.find((step) => step.id === "radicals");
      expect(
        screen.getByRole("heading", { level: 1, name: radicalsStep?.title }),
      ).toBeInTheDocument();
    });

    it("deep-links any step directly via ?step=", async () => {
      renderBlueprint("/learn/foundations?step=tones");

      const tonesStep = BLUEPRINT_STEPS.find((step) => step.id === "tones");
      expect(
        await screen.findByRole("heading", { level: 1, name: tonesStep?.title }),
      ).toBeInTheDocument();
    });

    it("resumes at the stored step instead of restarting at step 1", async () => {
      writeBlueprintPosition({ lastStepId: "stroke-order", completedAt: null });

      renderBlueprint();

      const strokeStep = BLUEPRINT_STEPS.find((step) => step.id === "stroke-order");
      expect(
        await screen.findByRole("heading", { level: 1, name: strokeStep?.title }),
      ).toBeInTheDocument();
    });

    it("records the step it moved to, so a remount resumes there", async () => {
      const first = renderBlueprint();
      await screen.findByRole("heading", { level: 1, name: BLUEPRINT_STEPS[0].title });
      await userEvent.click(screen.getByRole("button", { name: "Continue" }));
      first.unmount();

      renderBlueprint();

      expect(
        await screen.findByRole("heading", { level: 1, name: BLUEPRINT_STEPS[1].title }),
      ).toBeInTheDocument();
    });

    it("marks completion once, then offers the reference as the CTA", async () => {
      renderBlueprint("/learn/foundations?step=characters");
      await screen.findByRole("heading", {
        level: 1,
        name: BLUEPRINT_STEPS[BLUEPRINT_STEPS.length - 1].title,
      });

      await userEvent.click(screen.getByRole("button", { name: "Finish the Blueprint" }));

      expect(screen.getByTestId("location")).toHaveTextContent("/learn/foundations/reference");
      expect(readBlueprintPosition().completedAt).not.toBeNull();
    });

    it("shows the completed state on a later visit and never gates a step", async () => {
      writeBlueprintPosition({
        lastStepId: "characters",
        completedAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
      });

      renderBlueprint();

      expect(await screen.findByText(new RegExp("Blueprint complete"))).toBeInTheDocument();
      // Completion changes copy and the last-step CTA — it disables nothing.
      expect(screen.getByRole("button", { name: "Open the reference" })).toBeEnabled();
      for (const button of within(
        screen.getByRole("navigation", { name: "Blueprint steps" }),
      ).getAllByRole("button")) {
        expect(button).toBeEnabled();
      }
    });
  });
});
