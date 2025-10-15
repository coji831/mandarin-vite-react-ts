import { useCallback, useEffect, useState, useRef } from "react";

import { ConversationTurns, PlaybackControls } from ".";
import { useAudioPlayback, useConversationGenerator } from "../hooks";
import { Conversation } from "../types";
import "./ConversationBox.css";
import { log } from "console";

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

  // Browser TTS fallback state
  const [ttsFallback, setTtsFallback] = useState(false);

  const {
    audioData,
    isPlaying,
    currentTurn,
    playAudio,
    pauseAudio,
    isLoading: isLoadingAudio,
    error: audioError,
  } = useAudioPlayback();

  useEffect(() => {
    handleGenerateConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordId, word]);

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
    try {
      await playAudio({
        wordId,
        voice: "cmn-CN-Standard-A",
        bitrate: 128,
      });
      setTtsFallback(false);
    } catch (error) {
      // Fallback to browser TTS
      if (conversation) {
        setTtsFallback(true);
        const utter = new window.SpeechSynthesisUtterance(
          conversation.turns.map((t) => t.text).join(". ")
        );
        utter.lang = "zh-CN";
        window.speechSynthesis.speak(utter);
      }
      console.error("Failed to play audio, using browser TTS:", error);
    }
  }, [conversation, playAudio]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    pauseAudio();
    onClose?.();
  }, [pauseAudio, onClose]);

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
            {ttsFallback && (
              <div className="conversation-box__tts-fallback">
                <p>Audio unavailable, using browser TTS.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
