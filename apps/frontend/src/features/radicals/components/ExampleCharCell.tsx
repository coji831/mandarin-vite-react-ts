/**
 * @file components/ExampleCharCell.tsx
 * @description Single character row — compact list item with two action buttons
 * Story 19.2: Radical Detail Card
 *
 * Layout:
 *   [glyph]  [pinyin meaning]           [🔊] [↗]
 *   ────────  info area ────────  ── actions ──
 *
 * Audio + Hub use <Button variant="icon"> from shared components with
 * custom CSS to override the default 22×22 size to 28×28.
 */

import { useCallback } from "react";
import { Button, ClassificationBadge } from "shared/components";
import { openHub } from "shared/store";
import { useAudioPlayback } from "shared/hooks";
import "./ExampleCharCell.css";

interface ExampleCharCellProps {
  character: string;
  pinyin: string;
  meaning: string;
  classification?: string | null;
  etymology?: string | null;
}

export function ExampleCharCell({
  character,
  pinyin,
  meaning,
  classification,
  etymology,
}: ExampleCharCellProps) {
  const { playWordAudio } = useAudioPlayback();

  const handleHubClick = useCallback(() => {
    openHub({ entityType: "character", entityId: character, label: pinyin });
  }, [character, pinyin]);

  function handleAudioClick(e: React.MouseEvent) {
    e.stopPropagation();
    playWordAudio({ chinese: character, fallbackToBrowserTTS: true });
  }

  const isPictograph = classification === "pictograph";
  const cellTitle = isPictograph && etymology ? etymology : undefined;
  const cellClass = [
    "example-char-row",
    isPictograph ? "example-char-cell--pictograph" : "",
    "p-sm",
    "flex",
    "items-center",
    "gap-sm",
    "radius-sm",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cellClass} role="listitem" title={cellTitle}>
      <span className="example-char-row__glyph text-primary lh-1 text-center font-xl shrink-0">
        {character}
      </span>

      <div className="example-char-row__info flex-1 flex items-center gap-md">
        <span className="example-char-row__pinyin font-sm text-primary-light font-italic">
          {pinyin}
        </span>
        <span className="example-char-row__meaning font-sm text-muted whitespace-nowrap overflow-hidden">
          {meaning}
        </span>
        {classification && (
          <span className="example-char-row__badge shrink-0">
            <ClassificationBadge classification={classification} etymology={etymology} size="sm" />
          </span>
        )}
      </div>

      <div className="example-char-row__actions flex shrink-0 gap-xs">
        <Button
          variant="icon"
          width={28}
          height={28}
          onClick={handleAudioClick}
          aria-label={`Play audio for ${character}`}
          title="Listen to pronunciation"
        >
          🔊
        </Button>
        <Button
          variant="icon"
          width={28}
          height={28}
          onClick={handleHubClick}
          aria-label={`${character} — ${pinyin} — ${meaning}`}
          title="View character details"
        >
          ↗
        </Button>
      </div>
    </div>
  );
}
