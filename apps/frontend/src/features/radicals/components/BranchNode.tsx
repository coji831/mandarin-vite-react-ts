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
import { useCharacterHub } from "shared/hooks";
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
  const { openHub } = useCharacterHub();

  const handleClick = useCallback(() => {
    openHub(character, pinyin);
  }, [character, pinyin, openHub]);

  const handlePlayAudio = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(character);
        utterance.lang = "zh-CN";
        const voices = window.speechSynthesis.getVoices();
        const zhVoice = voices.find((v) => v.lang.startsWith("zh"));
        if (zhVoice) utterance.voice = zhVoice;
        window.speechSynthesis.speak(utterance);
      }
    },
    [character],
  );

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
    <div
      className={`branch-node ${showConnector ? "branch-node--with-connector" : ""}`}
      role={ariaRole}
    >
      {/* Tree connector line */}
      {showConnector && <span className="branch-node__connector" aria-hidden="true" />}

      {/* Character glyph — opens Hub */}
      <div
        className="branch-node__main"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label={`${character} — ${pinyin} — ${meaning}`}
      >
        <span className="branch-node__glyph">{character}</span>
        <span className="branch-node__pinyin">{pinyin}</span>
        <span className="branch-node__separator">—</span>
        <span className="branch-node__meaning">{meaning}</span>
      </div>

      {/* Audio button */}
      <button
        className="branch-node__audio-btn"
        onClick={handlePlayAudio}
        type="button"
        aria-label={`Play pronunciation for ${character}`}
        title="Play pronunciation"
      >
        🔊
      </button>

      {/* Hub link */}
      <button
        className="branch-node__hub-btn"
        onClick={handleClick}
        type="button"
        aria-label={`Open ${character} in Character Detail Hub`}
        title="Open in Character Detail Hub"
      >
        Hub ▸
      </button>
    </div>
  );
}
