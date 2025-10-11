import type { ConversationTurn } from "../types";
import "./ConversationTurns.css";

type ConversationTurnsProps = {
  turns: ConversationTurn[];
  currentTurn?: number;
  isPlaying?: boolean;
  className?: string;
};

function ConversationTurns({
  turns,
  currentTurn = -1,
  isPlaying = false,
  className = "",
}: ConversationTurnsProps) {
  return (
    <div className={`conversation-turns ${className}`}>
      {turns.map((turn, index) => (
        <div key={index} className="conversation-turn" role="listitem">
          <span className="conversation-turn__speaker">{turn.speaker}</span>
          <div className="conversation-turn__content">
            <p className="conversation-turn__text">{turn.text}</p>
            {turn.translation && (
              <p className="conversation-turn__translation">{turn.translation}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export { ConversationTurns };
