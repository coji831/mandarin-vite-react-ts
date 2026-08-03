/**
 * @file pages/learn/foundations/__tests__/TonesTab.test.tsx
 * @description Tests for TonesTab — per-card audio loading affordance (MED 1).
 *
 * Verifies the per-card loading spinner appears when a tone card is clicked and
 * clears once the shared audio playback settles. Mocks `useAudioItemPlayback`
 * (spread-actual pattern) so isPlaying/isLoading can be driven across renders.
 *
 * NOTE: vitest config uses `mockReset: true`, so mock implementations must be
 * set in beforeEach (after the per-test reset), not in the vi.mock factory.
 */

/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TonesTab } from "../TonesTab";
import { foundationsService } from "features/foundations";
import type { PinyinTonesPool } from "features/foundations";

// Hoisted shared state read by the useAudioItemPlayback mock at render time.
const audioState = vi.hoisted(() => ({
  play: vi.fn(),
  isPlaying: false,
  isLoading: false,
}));

vi.mock("shared/hooks", () => ({
  useAudioItemPlayback: () => ({
    play: audioState.play,
    pause: vi.fn(),
    stop: vi.fn(),
    isPlaying: audioState.isPlaying,
    isLoading: audioState.isLoading,
    status: audioState.isLoading ? "loading" : audioState.isPlaying ? "playing" : "idle",
    error: null,
  }),
  // Phase 2: TonesTab resolves pinyin → Hanzi via the shared charMap hook.
  usePinyinCharacterMap: () => ({
    charMap: { mā: "妈" },
    isLoading: false,
    error: null,
  }),
}));

vi.mock("../../../../features/foundations/services/foundationsService", () => ({
  foundationsService: {
    getPinyinTonesPool: vi.fn(),
  },
}));

const pool: PinyinTonesPool = {
  initials: [],
  finals: [],
  combinations: [],
  toneInfo: [
    {
      number: 1,
      name: "First Tone",
      mark: "mā",
      pinyinExample: "mā",
      chineseExample: "妈",
      description: "high and level",
      contour: [5, 5, 5, 5, 5],
      color: "#ff5252",
    },
  ],
  tonePairs: [],
  toneRules: [],
};

describe("TonesTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    audioState.isPlaying = false;
    audioState.isLoading = false;
    vi.mocked(foundationsService.getPinyinTonesPool).mockResolvedValue(pool);
  });

  it("shows the per-card loading affordance on click and clears it when playback settles", async () => {
    const { rerender } = render(<TonesTab />);

    // Wait for tones data to load → tone card play button appears.
    const playButton = await screen.findByRole("button", { name: "Play mā" });
    expect(playButton).not.toBeDisabled();

    // Click the tone card → pinyin resolves to its Hanzi glyph via the shared
    // charMap (mā → 妈) and is played through the shared audio hook.
    fireEvent.click(playButton);
    expect(audioState.play).toHaveBeenCalledWith("妈");
    expect(screen.getByRole("button", { name: "Generating audio..." })).toBeDisabled();

    // Manager transitions to loading, then playing — spinner stays visible.
    audioState.isLoading = true;
    rerender(<TonesTab />);
    expect(screen.getByRole("button", { name: "Generating audio..." })).toBeDisabled();

    audioState.isLoading = false;
    audioState.isPlaying = true;
    rerender(<TonesTab />);
    expect(screen.getByRole("button", { name: "Generating audio..." })).toBeInTheDocument();

    // Playback settles → per-card loading flag clears → spinner disappears.
    audioState.isPlaying = false;
    rerender(<TonesTab />);
    expect(screen.queryByRole("button", { name: "Generating audio..." })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play mā" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play mā" })).not.toBeDisabled();
  });
});
