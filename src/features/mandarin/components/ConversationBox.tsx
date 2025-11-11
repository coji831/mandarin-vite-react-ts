import { useCallback, useEffect, useState } from "react";

import { ConversationTurns, PlaybackControls } from ".";
import { useAudioPlayback, useConversationGenerator } from "../hooks";
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

  const {
    generateConversation,
    isLoading: isGenerating,
    error: generationError,
    clearError,
  } = useConversationGenerator();

  const {
    isPlaying,
    currentTurn,
    playConversationAudio,
    pauseAudio,
    isLoading: isLoadingAudio,
    error: audioError,
  } = useAudioPlayback();

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

  const handlePlayAudio = useCallback(async () => {
    if (!conversation) return;
    await playConversationAudio({
      wordId: conversation.wordId,
      voice: "cmn-CN-Standard-A",
      bitrate: 128,
    });
  }, [conversation, playConversationAudio]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    pauseAudio();
    onClose?.();
  }, [pauseAudio, onClose]);

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
              currentTurn={currentTurn}
              isPlaying={isPlaying}
              className="conversation-box__turns"
            />
            <PlaybackControls
              onPlay={handlePlayAudio}
              onPause={pauseAudio}
              isPlaying={isPlaying}
              isLoading={isLoadingAudio}
              error={audioError}
              className="conversation-box__controls"
            />
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
