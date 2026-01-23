/**
 * ConversationBox component
 *
 * - Displays a modal/overlay for a generated Mandarin conversation for a given word.
 * - Handles conversation data fetching, loading, and error states.
 * - Delegates all turn navigation and per-turn audio playback to ConversationTurns.
 * - Supports closing the box and retrying conversation generation.
 * - UI/UX: Modern, accessible, and responsive; integrates with ConversationTurns for audio and navigation.
 *
 * Usage:
 *   <ConversationBox wordId={...} word={...} onClose={...} />
 *
 * See also: ConversationTurns, useConversationGenerator, useAudioPlayback
 */
import { useCallback, useEffect, useState } from "react";

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
