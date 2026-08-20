/**
 * @file components/BranchNode.tsx
 * @description Individual character node — horizontal row with glyph, pinyin, meaning, audio button, and Hub link
 * Story 19.4: Radical Trees (Phase 3)
 *
 * Shows character glyph, pinyin, and meaning in a compact horizontal row.
 * Audio button plays pronunciation through the shared AudioManager
 * (useAudioItemPlayback → default word contract) — one audio app-wide.
 * Character glyph clickable → opens Character Detail Hub.
 * Optional tree connector line via showConnector prop.
 */

import { useCallback } from "react";
import { Box, Button, Icon } from "shared/components";
import { useAudioItemPlayback } from "shared/hooks";
import { openHub } from "shared/store";
import "./BranchNode.css";

interface BranchNodeProps {
  character: string;
  pinyin: string;
  meaning: string;
  showConnector?: boolean;
  ariaRole?: string;
}

export function BranchNode({
  character,
  pinyin,
  meaning,
  showConnector = false,
  ariaRole = "listitem",
}: BranchNodeProps) {
  const { play } = useAudioItemPlayback();

  const handleClick = useCallback(() => {
    openHub({ entityType: "character", entityId: character, label: pinyin });
  }, [character, pinyin]);

  /**
   * Phase D3 — audio now routes through the shared AudioManager with the
   * default word contract (the same manager every other surface uses, so there
   * is one audio app-wide). The hand-rolled SpeechSynthesisUtterance path is gone.
   *
   * Intended behavior change: playing this node cancels any other active audio,
   * and any other play cancels this one — deliberate, kills the "two audios at
   * once" bug. (Confirmed acceptable by the user.)
   */
  const handlePlayAudio = useCallback(() => {
    play(character);
  }, [play, character]);

  return (
    <Box
      className={`branch-node flex items-center gap-sm p-xs relative ${showConnector ? "branch-node--with-connector" : ""}`}
      role={ariaRole}
    >
      {/* Tree connector line */}
      {showConnector && (
        <span className="branch-node__connector border-surface" aria-hidden="true" />
      )}

      {/* Character glyph — opens Hub */}
      <Button
        variant="ghost"
        className="branch-node__main flex-1"
        onClick={handleClick}
        aria-label={`${character} — ${pinyin} — ${meaning}`}
      >
        <span className="branch-node__glyph font-lg text-primary lh-1 text-center">
          {character}
        </span>
        <span className="branch-node__pinyin font-sm text-primary-light lh-1">{pinyin}</span>
        <span className="font-sm text-muted lh-1">—</span>
        <span className="branch-node__meaning font-xs text-muted lh-1">{meaning}</span>
      </Button>

      {/* Audio button */}
      <Button
        variant="ghost"
        className="branch-node__audio-btn font-sm p-xs transition-fast lh-1 shrink-0 hover:border-primary-border"
        onClick={handlePlayAudio}
        aria-label={`Play pronunciation for ${character}`}
        title="Play pronunciation"
      >
        <Icon name="audio" size={16} aria-hidden />
      </Button>

      {/* Hub link */}
      <Button
        variant="ghost"
        className="branch-node__hub-btn font-xs p-xs radius-md transition-fast whitespace-nowrap shrink-0 hover:border-primary-border"
        onClick={handleClick}
        aria-label={`Open ${character} in Character Detail Hub`}
        title="Open in Character Detail Hub"
      >
        Hub ▸
      </Button>
    </Box>
  );
}
