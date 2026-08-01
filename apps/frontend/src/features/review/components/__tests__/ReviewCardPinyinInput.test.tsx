/**
 * @file ReviewCardPinyinInput.test.tsx
 * @description Integration test — tapping the review flashcard glyph opens the Character Hub (B18).
 *
 * Guards against the B18 gap: the review flashcard glyph was a no-op span. It must
 * open the hub with the character glyph + pinyin, matching how other surfaces do.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReviewCardPinyinInput } from "../ReviewCardPinyinInput";
import { useHubStore } from "shared/store";
import type { ReviewItem } from "../../types";

const ITEM: ReviewItem = {
  id: "r1",
  itemType: "pinyin-syllable",
  itemId: "pw-ren",
  front: "rèn",
  back: "to recognize",
  character: "认",
  pinyinPlain: "ren",
  meaning: "to recognize",
};

const defaultProps = {
  item: ITEM,
  onSubmitPinyin: () => {},
  onPlayAudio: () => {},
};

beforeEach(() => {
  useHubStore.setState({ isOpen: false, currentEntity: null, navigationStack: [] });
});

describe("ReviewCardPinyinInput", () => {
  it("opens the Character Hub with glyph + pinyin when the glyph is tapped", async () => {
    const user = userEvent.setup();
    render(<ReviewCardPinyinInput {...defaultProps} />);

    const glyph = screen.getByRole("button", { name: "View details for 认" });
    expect(glyph).toBeInTheDocument();

    await user.click(glyph);

    const state = useHubStore.getState();
    expect(state.isOpen).toBe(true);
    expect(state.currentEntity).toEqual({
      entityType: "character",
      entityId: "认",
      label: "ren",
    });
  });

  it("does not open the hub when the audio button is clicked", async () => {
    const user = userEvent.setup();
    const onPlayAudio = vi.fn();
    render(<ReviewCardPinyinInput {...defaultProps} onPlayAudio={onPlayAudio} />);

    await user.click(screen.getByRole("button", { name: "Play audio" }));

    expect(onPlayAudio).toHaveBeenCalledWith("认");
    expect(useHubStore.getState().isOpen).toBe(false);
  });
});
