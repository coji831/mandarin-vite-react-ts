/**
 * @file components/ExampleCharCell.test.tsx
 * @description Tests for ExampleCharCell component
 * Story 19.2: Radical Detail Card
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ExampleCharCell } from "./ExampleCharCell";

// Mock the hub store
const mockOpenHub = vi.hoisted(() => vi.fn());
vi.mock("shared/store", async () => {
  const actual = await vi.importActual("shared/store");
  return { ...actual, openHub: mockOpenHub };
});

// Mock the audio playback hook
const mockPlay = vi.hoisted(() => vi.fn());
vi.mock("shared/hooks", () => ({
  useAudioItemPlayback: () => ({
    play: mockPlay,
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

  it("calls openHub when clicked", () => {
    render(<ExampleCharCell character="水" pinyin="shuǐ" meaning="water" />);

    fireEvent.click(screen.getByRole("button", { name: "水 — shuǐ — water" }));
    expect(mockOpenHub).toHaveBeenCalledWith({
      entityType: "character",
      entityId: "水",
      label: "shuǐ",
    });
  });

  it("calls play when audio button is clicked", () => {
    render(<ExampleCharCell character="水" pinyin="shuǐ" meaning="water" />);

    const audioButton = screen.getByLabelText("Play audio for 水");
    fireEvent.click(audioButton);

    expect(mockPlay).toHaveBeenCalledWith("水");
  });

  it("does not call openHub when audio button is clicked", () => {
    render(<ExampleCharCell character="水" pinyin="shuǐ" meaning="water" />);

    const audioButton = screen.getByLabelText("Play audio for 水");
    fireEvent.click(audioButton);

    expect(mockOpenHub).not.toHaveBeenCalled();
  });

  it("has correct aria-label including meaning", () => {
    render(<ExampleCharCell character="水" pinyin="shuǐ" meaning="water" />);

    expect(screen.getByRole("button", { name: "水 — shuǐ — water" })).toBeInTheDocument();
  });

  describe("classification badge", () => {
    it("renders pictograph badge with golden border", () => {
      const { container } = render(
        <ExampleCharCell character="日" pinyin="rì" meaning="sun" classification="pictograph" />,
      );

      expect(screen.getByText("🖼️")).toBeInTheDocument();
      expect(screen.getByText("Pictograph")).toBeInTheDocument();
      // Check golden border class is applied
      const row = container.querySelector(".example-char-cell--pictograph");
      expect(row).toBeInTheDocument();
    });

    it("renders phono-semantic badge", () => {
      render(
        <ExampleCharCell
          character="江"
          pinyin="jiāng"
          meaning="river"
          classification="phono_semantic"
        />,
      );

      expect(screen.getByText("🔤")).toBeInTheDocument();
      expect(screen.getByText("Phono-semantic")).toBeInTheDocument();
    });

    it("renders compound ideograph badge", () => {
      render(
        <ExampleCharCell
          character="明"
          pinyin="míng"
          meaning="bright"
          classification="compound_ideograph"
        />,
      );

      expect(screen.getByText("🧩")).toBeInTheDocument();
      expect(screen.getByText("Compound ideograph")).toBeInTheDocument();
    });

    it("renders simple ideograph badge", () => {
      render(
        <ExampleCharCell
          character="上"
          pinyin="shàng"
          meaning="above"
          classification="ideograph"
        />,
      );

      expect(screen.getByText("⚡")).toBeInTheDocument();
      expect(screen.getByText("Simple ideograph")).toBeInTheDocument();
    });

    it("renders nothing when classification is null", () => {
      render(<ExampleCharCell character="水" pinyin="shuǐ" meaning="water" />);

      expect(screen.queryByText("🖼️")).not.toBeInTheDocument();
      expect(screen.queryByText("🔤")).not.toBeInTheDocument();
      expect(screen.queryByText("🧩")).not.toBeInTheDocument();
      expect(screen.queryByText("⚡")).not.toBeInTheDocument();
    });

    it("renders nothing when classification is undefined", () => {
      render(
        <ExampleCharCell character="水" pinyin="shuǐ" meaning="water" classification={undefined} />,
      );

      expect(screen.queryByText("🖼️")).not.toBeInTheDocument();
    });

    it("sets title attribute for pictograph with etymology", () => {
      render(
        <ExampleCharCell
          character="日"
          pinyin="rì"
          meaning="sun"
          classification="pictograph"
          etymology="A pictograph of the sun"
        />,
      );

      const row = screen.getByRole("listitem");
      expect(row).toHaveAttribute("title", "A pictograph of the sun");
    });

    it("does not set title for non-pictograph classifications", () => {
      render(
        <ExampleCharCell
          character="江"
          pinyin="jiāng"
          meaning="river"
          classification="phono_semantic"
          etymology="Some etymology"
        />,
      );

      const row = screen.getByRole("listitem");
      expect(row).not.toHaveAttribute("title");
    });
  });
});
