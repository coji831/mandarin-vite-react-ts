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
  } catch {}
}

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
  const [showPinyin, setShowPinyin] = useState(() => getSettingFromStorage("showPinyin", true));
  const [showEnglish, setShowEnglish] = useState(() => getSettingFromStorage("showEnglish", true));
  const [activeTurn, setActiveTurn] = useState(0);
  const [playingTurn, setPlayingTurn] = useState<number | null>(null);
  // Handlers for toggles
  const handleTogglePinyin = useCallback(() => {
    setShowPinyin((prev) => {
      setSettingToStorage("showPinyin", !prev);
      return !prev;
    });
  }, []);
  const handleToggleEnglish = useCallback(() => {
    setShowEnglish((prev) => {
      setSettingToStorage("showEnglish", !prev);
      return !prev;
    });
  }, []);
  // Navigation handlers
  const handleNextTurn = useCallback(() => {
    setActiveTurn((prev) => {
      if (!conversation) return prev;
      return Math.min(prev + 1, conversation.turns.length - 1);
    });
  }, [conversation]);
  const handlePrevTurn = useCallback(() => {
    setActiveTurn((prev) => Math.max(prev - 1, 0));
  }, []);
  // Keyboard navigation
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!isVisible || !conversation) return;
      if (e.key === "ArrowRight") {
        handleNextTurn();
        e.preventDefault();
      } else if (e.key === "ArrowLeft") {
        handlePrevTurn();
        e.preventDefault();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isVisible, conversation, handleNextTurn, handlePrevTurn]);

  const {
    generateConversation,
    isLoading: isGenerating,
    error: generationError,
    clearError,
  } = useConversationGenerator();

  const {
    isPlaying,
    playConversationAudio,
    pauseAudio,
    isLoading: isLoadingAudio,
    error: audioError,
  } = useAudioPlayback();

  // Per-turn audio handlers
  const handlePlayTurnAudio = useCallback(
    async (turnIdx: number) => {
      if (!conversation) return;
      setPlayingTurn(turnIdx);
      await playConversationAudio({
        wordId: conversation.wordId,
        voice: "cmn-CN-Standard-A",
        bitrate: 128,
        // Optionally: pass turn index for backend if needed
      });
    },
    [conversation, playConversationAudio]
  );
  const handlePauseTurnAudio = useCallback(() => {
    pauseAudio();
    setPlayingTurn(null);
  }, [pauseAudio]);

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
      setActiveTurn(0);
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
            <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
              <button
                onClick={handleTogglePinyin}
                aria-pressed={showPinyin}
                aria-label={showPinyin ? "Hide pinyin" : "Show pinyin"}
                className={showPinyin ? "active" : ""}
                style={{ minWidth: 80 }}
              >
                {showPinyin ? "Hide Pinyin" : "Show Pinyin"}
              </button>
              <button
                onClick={handleToggleEnglish}
                aria-pressed={showEnglish}
                aria-label={showEnglish ? "Hide English" : "Show English"}
                className={showEnglish ? "active" : ""}
                style={{ minWidth: 80 }}
              >
                {showEnglish ? "Hide English" : "Show English"}
              </button>
            </div>
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
                disabled={activeTurn === conversation.turns.length - 1}
                style={{ minWidth: 40 }}
              >
                Next &#8594;
              </button>
            </div>
            <ConversationTurns
              turns={conversation.turns}
              currentTurn={activeTurn}
              playingTurn={playingTurn}
              isPlaying={isPlaying}
              onPlayTurn={handlePlayTurnAudio}
              onPauseTurn={handlePauseTurnAudio}
              showPinyin={showPinyin}
              showEnglish={showEnglish}
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
