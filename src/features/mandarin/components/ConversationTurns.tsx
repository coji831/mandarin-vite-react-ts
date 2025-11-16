import type { ConversationTurn } from "../types";
import "./ConversationTurns.css";

type ConversationTurnsProps = {
  turns: ConversationTurn[];
  currentTurn?: number;
  playingTurn?: number | null;
  isPlaying?: boolean;
  onPlayTurn?: (turnIdx: number) => void;
  onPauseTurn?: () => void;
  showPinyin?: boolean;
  showEnglish?: boolean;
  className?: string;
};

function ConversationTurns({
  turns,
  currentTurn = -1,
  playingTurn = null,
  isPlaying = false,
  onPlayTurn,
  onPauseTurn,
  showPinyin = true,
  showEnglish = true,
  className = "",
}: ConversationTurnsProps) {
  return (
    <div className={`conversation-turns ${className}`}>
      {turns.map((turn, index) => {
        const isTurnPlaying = playingTurn === index && isPlaying;
        return (
          <div
            key={index}
            className={`conversation-turn${index === currentTurn ? " current" : ""}`}
            role="listitem"
            aria-current={index === currentTurn ? "true" : undefined}
          >
            <span className="conversation-turn__speaker">{turn.speaker}</span>
            <div className="conversation-turn__content">
              <button
                aria-label={
                  isTurnPlaying
                    ? `Pause audio for turn ${index + 1}`
                    : `Play audio for turn ${index + 1}`
                }
                onClick={() => {
                  if (isTurnPlaying) {
                    onPauseTurn && onPauseTurn();
                  } else {
                    onPlayTurn && onPlayTurn(index);
                  }
                }}
                className={`turn-audio-btn${isTurnPlaying ? " playing" : ""}`}
                style={{ marginRight: 8 }}
              >
                {isTurnPlaying ? "Pause" : "Play"}
              </button>
              <p className="conversation-turn__text">{turn.chinese}</p>
              {showPinyin && turn.pinyin && (
                <p
                  className="conversation-turn__pinyin"
                  style={{ color: "#b3e0ff", fontSize: 15, margin: 0 }}
                >
                  {turn.pinyin}
                </p>
              )}
              {showEnglish && turn.english && (
                <p className="conversation-turn__translation">{turn.english}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { ConversationTurns };
