/**
 * @file components/BranchNode.tsx
 * @description Individual character node — horizontal row with glyph, pinyin, meaning, audio button, and Hub link
 * Story 19.4: Radical Trees (Phase 3)
 *
 * Shows character glyph, pinyin, and meaning in a compact horizontal row.
 * Audio button plays pronunciation via SpeechSynthesis.
 * Character glyph clickable → opens Character Detail Hub.
 * Optional tree connector line via showConnector prop.
 */

import { useCallback } from "react";
import { Box, Button } from "shared/components";
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
  const handleClick = useCallback(() => {
    openHub({ entityType: "character", entityId: character, label: pinyin });
  }, [character, pinyin]);

  const handlePlayAudio = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(character);
      utterance.lang = "zh-CN";
      const voices = window.speechSynthesis.getVoices();
      const zhVoice = voices.find((v) => v.lang.startsWith("zh"));
      if (zhVoice) utterance.voice = zhVoice;
      window.speechSynthesis.speak(utterance);
    }
  }, [character]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick],
  );

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
        🔊
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
