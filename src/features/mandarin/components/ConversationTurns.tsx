/**
 * ConversationTurns component
 *
 * - Renders a list of conversation turns for a Mandarin conversation.
 * - Handles turn navigation (Prev/Next), active turn highlighting, and per-turn audio playback.
 * - Supports auto-play on navigation, click-to-replay, and visual playing/loading indicators.
 * - Displays Chinese, pinyin, and English for each turn, with accessibility and keyboard support.
 * - Used within ConversationBox; receives turns, wordId, and display options as props.
 *
 * Usage:
 *   <ConversationTurns turns={...} wordId={...} [showPinyin] [showEnglish] [autoPlay] />
 *
 * See also: useAudioPlayback, ConversationBox
 */
import { useState } from "react";

import { useAudioPlayback } from "../hooks";
import type { ConversationTurn } from "../types";
import "./ConversationTurns.css";

type ConversationTurnsProps = {
  turns: ConversationTurn[];
  wordId: string;
  showPinyin?: boolean;
  showEnglish?: boolean;
  autoPlay?: boolean;
  className?: string;
  // Optional callback to notify parent of turn change
  onTurnChange?: (turnIdx: number) => void;
};

function ConversationTurns({
  turns,
  wordId,
  className = "",
  onTurnChange,
}: ConversationTurnsProps) {
  const [activeTurn, setActiveTurn] = useState(0);
  const [playingTurn, setPlayingTurn] = useState<number | null>(null);
  const { isPlaying, playTurnAudio, isLoading, error } = useAudioPlayback();

  // Navigation handlers with auto-play
  const handleNextTurn = () => {
    setActiveTurn((prev) => {
      const next = Math.min(prev + 1, turns.length - 1);
      onTurnChange?.(next);
      // Auto-play audio for new turn if enabled
      if (next !== prev) {
        handlePlayTurnAudio(next);
      }
      return next;
    });
  };
  const handlePrevTurn = () => {
    setActiveTurn((prev) => {
      const prevTurn = Math.max(prev - 1, 0);
      onTurnChange?.(prevTurn);
      // Auto-play audio for new turn if enabled
      if (prevTurn !== prev) {
        handlePlayTurnAudio(prevTurn);
      }
      return prevTurn;
    });
  };

  // Play audio for a specific turn, generate if missing
  const handlePlayTurnAudio = async (turnIdx: number) => {
    setPlayingTurn(turnIdx);
    const turn = turns[turnIdx];
    try {
      await playTurnAudio({
        wordId,
        turnIndex: turnIdx,
        text: turn.chinese,
        voice: "cmn-CN-Standard-A",
      });
    } catch {
      // error is handled in hook
    }
  };

  // Click turn to set as active and play audio
  const handleClickTurn = (turnIdx: number) => {
    setActiveTurn(turnIdx);
    onTurnChange?.(turnIdx);
    handlePlayTurnAudio(turnIdx);
  };

  return (
    <div className={`conversation-turns ${className}`}>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <button
          onClick={handlePrevTurn}
          aria-label="Previous turn"
          disabled={activeTurn === 0}
          style={{ minWidth: 40 }}
        >
          &#8592; Prev
        </button>
        <button
          onClick={handleNextTurn}
          aria-label="Next turn"
          disabled={activeTurn === turns.length - 1}
          style={{ minWidth: 40 }}
        >
          Next &#8594;
        </button>
      </div>
      {turns.map((turn, index) => {
        const isTurnPlaying = playingTurn === index && isPlaying;
        const isTurnLoading = isLoading && playingTurn === index;
        return (
          <div
            key={index}
            className={`conversation-turn${index === activeTurn ? " current" : ""}${
              isTurnPlaying ? " playing" : ""
            }`}
            role="listitem"
            aria-current={index === activeTurn ? "true" : undefined}
            onClick={() => handleClickTurn(index)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleClickTurn(index);
              }
            }}
            tabIndex={0}
            style={{ cursor: "pointer" }}
            aria-label={`Turn ${index + 1}: ${turn.chinese}`}
            title="Click to play audio"
          >
            <span className="conversation-turn__speaker">{turn.speaker}</span>
            <div className="conversation-turn__content">
              <p className="conversation-turn__text">{turn.chinese}</p>
              {error && isTurnPlaying && (
                <span style={{ color: "#ff6b6b", fontSize: 13, marginTop: 4 }}>{error}</span>
              )}
              {turn.pinyin && (
                <p
                  className="conversation-turn__pinyin"
                  style={{ color: "#b3e0ff", fontSize: 15, margin: 0 }}
                >
                  {turn.pinyin}
                </p>
              )}
              {turn.english && <p className="conversation-turn__translation">{turn.english}</p>}
            </div>
            {/* Visual playing state indicator at end */}
            {isTurnPlaying && (
              <span className="audio-playing-indicator" aria-label="Audio playing">
                🔊
              </span>
            )}
            {isTurnLoading && (
              <span className="audio-loading-indicator" aria-label="Loading audio">
                ⏳
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export { ConversationTurns };
