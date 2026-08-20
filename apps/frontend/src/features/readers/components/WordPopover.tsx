/**
 * @file WordPopover.tsx
 * @description Inline popover near the tapped word — compact card with glyph,
 * pinyin, meaning, and "Open in Word Hub" button.
 * Story 21.4: Reading UI + LexicalHub Phase 1
 * Story 21.x: Migrated onOpenHub prop → direct Zustand hubStore access.
 * Phase 4: Reads glyph, position, and closePopover from readingStore.
 *
 * Reads readingStore directly for popover state (glyph, position).
 * Must handle viewport edges (positions correctly near any edge).
 */
import { useEffect, useRef, useState } from "react";
import { Box, Button, Skeleton } from "shared/components";
import { openHub } from "shared/store";
import { useReadingStore } from "../stores";
import { useWordDetail } from "features/word-hub/hooks";
import "./WordPopover.css";

export function WordPopover() {
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const glyph = useReadingStore((s) => s.popover.glyph);
  const position = useReadingStore((s) => s.popover.position);
  const closePopover = useReadingStore((s) => s.closePopover);

  // Self-fetch word detail (pinyin, definitions) using the same hook as WordHubContent
  const { data: wordDetail, isLoading } = useWordDetail(glyph);
  const [adjustedPos, setAdjustedPos] = useState({ top: 0, left: 0 });

  // Move focus into the dialog on open (WCAG 2.4.3); return it to the trigger on close.
  // The popover is mounted conditionally ({popover.glyph && <WordPopover />}), so mount
  // happens right after the word is tapped and unmount when the popover closes.
  useEffect(() => {
    triggerRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    popoverRef.current?.focus();
    return () => {
      const trigger = triggerRef.current;
      if (trigger && document.contains(trigger)) {
        trigger.focus();
      }
    };
  }, []);

  useEffect(() => {
    if (!popoverRef.current) return;

    const popover = popoverRef.current;
    const rect = popover.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    const popoverTop = position?.y ?? 0;
    const popoverLeft = position?.x ?? 0;
    let { top, left } = { top: popoverTop, left: popoverLeft };

    // Adjust horizontal: if near right edge, position left of word
    if (left + rect.width > viewportW - 16) {
      left = viewportW - rect.width - 16;
    }
    if (left < 16) {
      left = 16;
    }

    // Adjust vertical: if near bottom edge, position above the word
    if (top + rect.height > viewportH - 16) {
      top = popoverTop - rect.height - 8;
    }
    if (top < 16) {
      top = 16;
    }

    setAdjustedPos({ top, left });
  }, [position?.x, position?.y]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePopover();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closePopover]);

  // Resolve display values
  const displayGlyph = glyph ?? "";
  const displayPinyin = wordDetail?.pinyin ?? "";
  const displayMeaning = wordDetail?.definitions?.join("; ") ?? "";

  const viewDetailHandler = () => {
    openHub({
      entityType: "word",
      entityId: displayGlyph,
      label: displayPinyin,
    });
  };
  return (
    <>
      {/* Backdrop to capture outside clicks */}
      <div
        className="word-popover__backdrop fixed bg-transparent inset-0"
        onClick={closePopover}
        aria-hidden="true"
      />

      <Box
        variant="elevated"
        padding="md"
        className="word-popover flex-col gap-sm shadow-elevated-2 animate-fade-in border-1 border-primary-border"
        ref={popoverRef}
        tabIndex={-1}
        style={{
          position: "fixed",
          top: `${adjustedPos.top}px`,
          left: `${adjustedPos.left}px`,
        }}
        role="dialog"
        aria-label={`Word details: ${displayGlyph}`}
      >
        {/* Close button */}
        <button
          type="button"
          className="word-popover__close btn-base btn-close"
          onClick={closePopover}
          aria-label="Close popover"
        >
          ×
        </button>

        {/* Hero: glyph */}
        <div className="word-popover__hero text-center py-xs">
          <span className="word-popover__glyph font-3xl fw-700 text-primary lh-1 block">
            {displayGlyph}
          </span>
        </div>

        {/* Pinyin + meaning */}
        <div className="word-popover__info flex-col gap-xs text-center py-xs">
          {isLoading ? (
            <>
              <Skeleton variant="line" width="80px" height="16px" />
              <Skeleton variant="line" width="120px" height="14px" />
            </>
          ) : (
            <>
              <span className="word-popover__pinyin font-md text-tertiary">{displayPinyin}</span>
              <span className="word-popover__meaning font-sm text-secondary lh-1-4">
                {displayMeaning}
              </span>
            </>
          )}
        </div>

        {/* CTA */}
        <div className="word-popover__cta flex-center py-xs">
          <Button variant="primary" size="sm" onClick={viewDetailHandler}>
            View Details
          </Button>
        </div>
      </Box>
    </>
  );
}
