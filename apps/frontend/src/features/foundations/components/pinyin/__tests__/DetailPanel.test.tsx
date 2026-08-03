/**
 * @file components/pinyin/__tests__/DetailPanel.test.tsx
 * @description Tests for DetailPanel charMap lookup + Play button gating.
 *
 * Covers the validated fix where grid data uses tone-number pinyin ("ba1")
 * but the charMap is keyed by tone-marked/plain pinyin ("bā", "ba"): the
 * lookup must normalize before resolving, and the Play button must never be
 * a silent no-op when no character is mapped (disabled + tooltip instead).
 *
 * NOTE: vitest config uses `mockReset: true`, so mocks without implementations
 * (play/openHub) are safe to hoist — they only record call history.
 */

/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DetailPanel } from "../DetailPanel";

// Hoisted mocks read by the vi.mock factories at module load time.
const mockPlay = vi.hoisted(() => vi.fn());
const mockOpenHub = vi.hoisted(() => vi.fn());

vi.mock("shared/hooks", () => ({
  useAudioItemPlayback: () => ({
    play: mockPlay,
    pause: vi.fn(),
    stop: vi.fn(),
    isPlaying: false,
    isLoading: false,
    status: "idle",
    error: null,
  }),
}));

vi.mock("shared/store", async () => {
  const actual = await vi.importActual("shared/store");
  return { ...actual, openHub: mockOpenHub };
});

const baseProps = {
  initial: "b",
  final: "a",
  onClose: vi.fn(),
};

describe("DetailPanel", () => {
  it('resolves tone-number pinyin ("ba1") to the plain-pinyin charMap key and renders the character', () => {
    render(
      <DetailPanel
        {...baseProps}
        tones={["ba1", "ba2", "ba3", "ba4", "ba5"]}
        charMap={{ ba: "八" }}
      />,
    );

    // The character resolves — not the "—" placeholder.
    expect(screen.getByText("八")).toBeInTheDocument();
    expect(screen.queryByText("—")).not.toBeInTheDocument();

    // The Play button is enabled and plays the resolved character.
    const playButton = screen.getByRole("button", { name: /play/i });
    expect(playButton).not.toBeDisabled();
    fireEvent.click(playButton);
    expect(mockPlay).toHaveBeenCalledWith("八");
  });

  it('still resolves tone-marked pinyin ("bā") via the activeTone charMap key', () => {
    render(<DetailPanel {...baseProps} tones={["bā"]} charMap={{ bā: "八" }} />);

    expect(screen.getByText("八")).toBeInTheDocument();
    // activeTone display is unchanged (big colored pinyin text stays tone-marked).
    expect(screen.getByText("bā")).toBeInTheDocument();
  });

  it('renders the tone-marked display ("bāi") instead of the raw tone number ("bai1")', () => {
    render(
      <DetailPanel
        {...baseProps}
        tones={["bai1", "bai2", "bai3", "bai4", "bai0"]}
        charMap={{ bāi: "掰", bai: "伯" }}
      />,
    );

    // Big display shows the tone-marked form, never the raw tone number.
    expect(screen.getByText("bāi")).toBeInTheDocument();
    expect(screen.queryByText("bai1")).not.toBeInTheDocument();

    // Character resolves to the tone-marked key glyph (掰 = bāi), not the
    // conflicting plain key glyph (伯 = bó).
    expect(screen.getByText("掰")).toBeInTheDocument();
    expect(screen.queryByText("伯")).not.toBeInTheDocument();

    // The character-link label passed to openHub is the marked form.
    const charLink = screen.getByRole("button", { name: /掰/ });
    fireEvent.click(charLink);
    expect(mockOpenHub).toHaveBeenCalledWith(expect.objectContaining({ label: "bāi" }));
  });

  it("disables the Play button with a tooltip when charMap has no mapping (empty object)", () => {
    render(<DetailPanel {...baseProps} tones={["ba1"]} charMap={{}} />);

    // The "—" dash correctly indicates no mapped character.
    expect(screen.getByText("—")).toBeInTheDocument();

    const playButton = screen.getByRole("button", { name: /play/i });
    expect(playButton).toBeDisabled();
    expect(playButton).toHaveAttribute("title", "No character available for this syllable");

    // A disabled button is a no-op — play is never called.
    fireEvent.click(playButton);
    expect(mockPlay).not.toHaveBeenCalled();
  });

  it("disables the Play button when charMap is undefined", () => {
    render(<DetailPanel {...baseProps} tones={["ba1"]} />);

    expect(screen.getByText("—")).toBeInTheDocument();

    const playButton = screen.getByRole("button", { name: /play/i });
    expect(playButton).toBeDisabled();
    expect(playButton).toHaveAttribute("title", "No character available for this syllable");
  });
});
