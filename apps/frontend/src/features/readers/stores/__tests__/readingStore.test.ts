/**
 * @file stores/__tests__/readingStore.test.ts
 * @description Tests for readingStore (Zustand)
 * Story 21.4: Reading UI + LexicalHub Phase 1
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useReadingStore } from "../readingStore";

describe("readingStore", () => {
  beforeEach(() => {
    useReadingStore.setState(useReadingStore.getInitialState());
  });

  describe("initial state", () => {
    it("starts with null currentPassageId", () => {
      expect(useReadingStore.getState().currentPassageId).toBeNull();
    });

    it("starts in library mode", () => {
      expect(useReadingStore.getState().mode).toBe("library");
    });

    it("starts with closed popover", () => {
      const popover = useReadingStore.getState().popover;
      expect(popover.glyph).toBeNull();
      expect(popover.position).toBeNull();
    });
  });

  describe("setPassageId", () => {
    it("sets the passage ID", () => {
      useReadingStore.getState().setPassageId("passage-1");
      expect(useReadingStore.getState().currentPassageId).toBe("passage-1");
    });

    it("resets passage ID to null", () => {
      useReadingStore.getState().setPassageId("passage-1");
      useReadingStore.getState().setPassageId(null);
      expect(useReadingStore.getState().currentPassageId).toBeNull();
    });
  });

  describe("setMode", () => {
    it("sets mode to reading", () => {
      useReadingStore.getState().setMode("reading");
      expect(useReadingStore.getState().mode).toBe("reading");
    });

    it("sets mode to library", () => {
      useReadingStore.getState().setMode("reading");
      useReadingStore.getState().setMode("library");
      expect(useReadingStore.getState().mode).toBe("library");
    });
  });

  describe("openPopover / closePopover", () => {
    it("opens popover with glyph and position from DOMRect", () => {
      const rect = {
        left: 100,
        bottom: 200,
        top: 150,
        right: 200,
        width: 100,
        height: 50,
        x: 100,
        y: 150,
        toJSON: () => ({}),
      } as DOMRect;

      useReadingStore.getState().openPopover("好", rect);

      const popover = useReadingStore.getState().popover;
      expect(popover.glyph).toBe("好");
      expect(popover.position).toEqual({ x: 100, y: 200 });
    });

    it("closes popover", () => {
      const rect = { left: 100, bottom: 200 } as DOMRect;
      useReadingStore.getState().openPopover("好", rect);
      useReadingStore.getState().closePopover();

      const popover = useReadingStore.getState().popover;
      expect(popover.glyph).toBeNull();
      expect(popover.position).toBeNull();
    });
  });
});
