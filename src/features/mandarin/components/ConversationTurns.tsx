import type { ConversationTurn } from "../types";
import "./ConversationTurns.css";

type ConversationTurnsProps = {
  turns: ConversationTurn[];
  currentTurn?: number;
  isPlaying?: boolean;
  showPinyin?: boolean;
  showEnglish?: boolean;
  className?: string;
};

function ConversationTurns({
  turns,
  currentTurn = -1,
  isPlaying = false,
  showPinyin = true,
  showEnglish = true,
  className = "",
}: ConversationTurnsProps) {
  return (
    <div className={`conversation-turns ${className}`}>
      {turns.map((turn, index) => (
        <div key={index} className="conversation-turn" role="listitem">
          <span className="conversation-turn__speaker">{turn.speaker}</span>
          <div className="conversation-turn__content">
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
      ))}
    </div>
  );
}

export { ConversationTurns };
