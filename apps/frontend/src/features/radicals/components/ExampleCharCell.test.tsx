/**
 * @file components/ExampleCharCell.test.tsx
 * @description Tests for ExampleCharCell component
 * Story 19.2: Radical Detail Card
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ExampleCharCell } from "./ExampleCharCell";

// Mock the hub store
const mockOpen = vi.fn();
vi.mock("shared/store", () => ({
  useHubStore: (selector: (s: { open: typeof mockOpen }) => unknown) =>
    selector({ open: mockOpen }),
}));

// Mock the audio playback hook
const mockPlayWordAudio = vi.fn();
vi.mock("shared/hooks", () => ({
  useAudioPlayback: () => ({
    playWordAudio: mockPlayWordAudio,
  }),
}));

describe("ExampleCharCell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders glyph, pinyin, and meaning", () => {
    render(<ExampleCharCell character="水" pinyin="shuǐ" meaning="water" />);

    expect(screen.getByText("水")).toBeInTheDocument();
    expect(screen.getByText("shuǐ")).toBeInTheDocument();
    expect(screen.getByText("water")).toBeInTheDocument();
  });

  it("calls hubStore.open when clicked", () => {
    render(<ExampleCharCell character="水" pinyin="shuǐ" meaning="water" />);

    fireEvent.click(screen.getByRole("button", { name: "水 — shuǐ — water" }));
    expect(mockOpen).toHaveBeenCalledWith("水", "shuǐ");
  });

  it("calls playWordAudio when audio button is clicked", () => {
    render(<ExampleCharCell character="水" pinyin="shuǐ" meaning="water" />);

    const audioButton = screen.getByLabelText("Play audio for 水");
    fireEvent.click(audioButton);

    expect(mockPlayWordAudio).toHaveBeenCalledWith({
      chinese: "水",
      fallbackToBrowserTTS: true,
    });
  });

  it("does not call hubStore.open when audio button is clicked", () => {
    render(<ExampleCharCell character="水" pinyin="shuǐ" meaning="water" />);

    const audioButton = screen.getByLabelText("Play audio for 水");
    fireEvent.click(audioButton);

    expect(mockOpen).not.toHaveBeenCalled();
  });

  it("has correct aria-label including meaning", () => {
    render(<ExampleCharCell character="水" pinyin="shuǐ" meaning="water" />);

    expect(screen.getByRole("button", { name: "水 — shuǐ — water" })).toBeInTheDocument();
  });
});
