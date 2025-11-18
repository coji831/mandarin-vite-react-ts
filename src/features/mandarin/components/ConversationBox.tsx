import { useCallback, useEffect, useState } from "react";
// Utility for localStorage persistence
function getSettingFromStorage(key: string, defaultValue: boolean) {
  try {
    const value = localStorage.getItem(key);
    if (value === null) return defaultValue;
    return value === "true";
  } catch {
    return defaultValue;
  }
}

function setSettingToStorage(key: string, value: boolean) {
  try {
    localStorage.setItem(key, value ? "true" : "false");
  } catch (error) {
    console.log(error);
  }
}

import { ConversationTurns } from ".";
import { useConversationGenerator } from "../hooks";
import { Conversation } from "../types";
import "./ConversationBox.css";

export { ConversationBox };

type ConversationBoxProps = {
  wordId: string;
  word: string;
  onClose?: () => void;
  className?: string;
};

function ConversationBox({ wordId, word, onClose, className = "" }: ConversationBoxProps) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Audio and turn navigation logic moved to ConversationTurns
  const {
    generateConversation,
    isLoading: isGenerating,
    error: generationError,
    clearError,
  } = useConversationGenerator();

  const handleGenerateConversation = useCallback(async () => {
    console.log("Generating conversation for:", wordId, word);
    try {
      clearError();
      const newConversation = await generateConversation({
        wordId,
        word,
        generatorVersion: "v1",
      });
      setConversation(newConversation);
      // setActiveTurn(0); // removed, turn state is now managed in ConversationTurns
      console.log(newConversation);
      setIsVisible(true);
    } catch (error) {
      console.error("Failed to generate conversation:", error);
    }
  }, [wordId, word, generateConversation, clearError]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    onClose?.();
  }, [onClose]);

  // Automatically generate conversation on mount
  useEffect(() => {
    handleGenerateConversation();
  }, [handleGenerateConversation]);

  if (!isVisible && !isGenerating) return null;

  return (
    <div className={`conversation-box ${className}`}>
      <div className="conversation-box__content">
        {isGenerating && (
          <div className="conversation-box__loading">
            <div className="spinner" />
            <p>Generating conversation...</p>
          </div>
        )}
        {generationError && (
          <div className="conversation-box__error">
            <p>Failed to load conversation example</p>
            <button onClick={handleGenerateConversation}>Try Again</button>
          </div>
        )}
        {conversation && (
          <>
            <ConversationTurns
              turns={conversation.turns}
              wordId={conversation.wordId}
              className="conversation-box__turns"
            />
            {/* PlaybackControls removed; per-turn audio handled in ConversationTurns */}
            {/* Audio fallback UI is now handled by useAudioPlayback's error state */}
            <div style={{ marginTop: 8 }}>
              <button onClick={handleClose} className="secondary">
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
