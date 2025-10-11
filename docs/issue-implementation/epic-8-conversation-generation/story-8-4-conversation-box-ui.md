# Implementation 8-4: Conversation Box UI: wire to scaffolder

## Technical Scope

- React component for conversation display and interaction
- Integration with scaffolder endpoints for development
- Audio playback controls with turn-by-turn highlighting
- Loading states, error handling, and responsive design
- Feature flag support for scaffolder vs production generator

## Implementation Details

```typescript
// src/features/conversation/components/ConversationBox.tsx
import React, { useState, useCallback, useEffect } from "react";
import { Conversation, ConversationAudio } from "../types/conversation.types";
import { useConversationGenerator } from "../hooks/useConversationGenerator";
import { useAudioPlayback } from "../hooks/useAudioPlayback";
import { ConversationTurns } from "./ConversationTurns";
import { PlaybackControls } from "./PlaybackControls";

interface ConversationBoxProps {
  wordId: string;
  word: string;
  onClose?: () => void;
  className?: string;
}

export const ConversationBox: React.FC<ConversationBoxProps> = ({
  wordId,
  word,
  onClose,
  className = "",
}) => {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const {
    generateConversation,
    isLoading: isGenerating,
    error: generationError,
    clearError,
  } = useConversationGenerator();

  const {
    audioData,
    isPlaying,
    currentTurn,
    playAudio,
    pauseAudio,
    isLoading: isLoadingAudio,
    error: audioError,
  } = useAudioPlayback();

  // Generate conversation when component mounts or word changes
  useEffect(() => {
    handleGenerateConversation();
  }, [wordId, word]);

  const handleGenerateConversation = useCallback(async () => {
    try {
      clearError();
      const newConversation = await generateConversation({
        wordId,
        word,
        generatorVersion: "v1",
      });
      setConversation(newConversation);
      setIsVisible(true);
    } catch (error) {
      console.error("Failed to generate conversation:", error);
    }
  }, [wordId, word, generateConversation, clearError]);

  const handlePlayAudio = useCallback(async () => {
    if (!conversation) return;

    try {
      await playAudio({
        conversationId: conversation.id,
        voice: "cmn-CN-Standard-A",
        bitrate: 128,
      });
    } catch (error) {
      console.error("Failed to play audio:", error);
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
      <div className="conversation-box__header">
        <h3 className="conversation-box__title">Conversation Example: {word}</h3>
        <button
          className="conversation-box__close"
          onClick={handleClose}
          aria-label="Close conversation"
        >
          ×
        </button>
      </div>

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
          </>
        )}
      </div>
    </div>
  );
};
```

**Turn Display Component:**

```typescript
// src/features/conversation/components/ConversationTurns.tsx
import React from "react";
import { ConversationTurn } from "../types/conversation.types";
import { SpeakerLabel } from "./SpeakerLabel";

interface ConversationTurnsProps {
  turns: ConversationTurn[];
  currentTurn?: number;
  isPlaying?: boolean;
  className?: string;
}

export const ConversationTurns: React.FC<ConversationTurnsProps> = ({
  turns,
  currentTurn = -1,
  isPlaying = false,
  className = "",
}) => {
  return (
    <div className={`conversation-turns ${className}`}>
      {turns.map((turn, index) => {
        const isCurrentTurn = isPlaying && index === currentTurn;
        const isActiveRegion = isPlaying && index <= currentTurn;

        return (
          <div
            key={index}
            className={`conversation-turn ${isCurrentTurn ? "current" : ""} ${
              isActiveRegion ? "played" : ""
            }`}
            role="listitem"
          >
            <SpeakerLabel speaker={turn.speaker} />
            <div className="conversation-turn__content">
              <p className="conversation-turn__text">{turn.text}</p>
              {turn.translation && (
                <p className="conversation-turn__translation">{turn.translation}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
```

**Playback Controls:**

```typescript
// src/features/conversation/components/PlaybackControls.tsx
import React from "react";

interface PlaybackControlsProps {
  onPlay: () => void;
  onPause: () => void;
  isPlaying: boolean;
  isLoading: boolean;
  error?: string | null;
  className?: string;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  onPlay,
  onPause,
  isPlaying,
  isLoading,
  error,
  className = "",
}) => {
  return (
    <div className={`playback-controls ${className}`}>
      {error && (
        <div className="playback-controls__error">
          <p>Audio unavailable</p>
          <small>{error}</small>
        </div>
      )}

      <button
        className={`playback-controls__button ${isPlaying ? "playing" : ""}`}
        onClick={isPlaying ? onPause : onPlay}
        disabled={isLoading || !!error}
        aria-label={isPlaying ? "Pause audio" : "Play audio"}
      >
        {isLoading && <div className="spinner spinner--small" />}
        {!isLoading && (isPlaying ? "⏸️" : "▶️")}
        <span>{isPlaying ? "Pause" : "Play"}</span>
      </button>

      {isPlaying && (
        <div className="playback-controls__status">
          <div className="playback-indicator">
            <div className="playback-indicator__bar" />
          </div>
        </div>
      )}
    </div>
  );
};
```

**Custom Hooks:**

```typescript
// src/features/conversation/hooks/useConversationGenerator.ts
import { useState, useCallback } from "react";
import { Conversation } from "../types/conversation.types";
import { generateConversation as apiGenerateConversation } from "../services/conversationApi";

export function useConversationGenerator() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateConversation = useCallback(
    async (params: {
      wordId: string;
      word: string;
      generatorVersion?: string;
    }): Promise<Conversation> => {
      setIsLoading(true);
      setError(null);

      try {
        const conversation = await apiGenerateConversation(params);
        return conversation;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    generateConversation,
    isLoading,
    error,
    clearError,
  };
}
```

## Architecture Integration

```
FlashcardDetailPage → ConversationBox → ConversationTurns + PlaybackControls
                           ↓                      ↓
                    useConversationGenerator  useAudioPlayback
                           ↓                      ↓
                    conversationApi          audioApi
                           ↓                      ↓
                    [Scaffolder/Production]  [Scaffolder/Production]
```

The component architecture enables clean separation of concerns with reusable hooks for data fetching and audio control, while the UI components focus purely on presentation and user interaction.

## Technical Challenges & Solutions

**Challenge:** Synchronized audio highlighting with timeline metadata

```typescript
// Solution: Timeline-driven turn highlighting
function useAudioTimeline(audioData: ConversationAudio, isPlaying: boolean) {
  const [currentTurn, setCurrentTurn] = useState(-1);

  useEffect(() => {
    if (!isPlaying || !audioData?.timeline) return;

    const audio = document.querySelector("audio") as HTMLAudioElement;
    if (!audio) return;

    const updateTurn = () => {
      const currentTime = audio.currentTime;
      const timeline = audioData.timeline!;

      // Find current turn based on timeline
      for (let i = timeline.length - 1; i >= 0; i--) {
        if (currentTime >= timeline[i].timeSeconds) {
          setCurrentTurn(i);
          break;
        }
      }
    };

    audio.addEventListener("timeupdate", updateTurn);
    return () => audio.removeEventListener("timeupdate", updateTurn);
  }, [audioData, isPlaying]);

  return currentTurn;
}
```

**Challenge:** Graceful fallback when scaffolder is disabled

```typescript
// Solution: Environment-aware feature detection
function useFeatureFlags() {
  const [conversationEnabled, setConversationEnabled] = useState(false);

  useEffect(() => {
    // Check if conversation endpoints are available
    fetch("/api/conversation/health")
      .then((res) => res.json())
      .then((data) => setConversationEnabled(data.enabled))
      .catch(() => setConversationEnabled(false));
  }, []);

  return { conversationEnabled };
}
```

**Challenge:** Responsive design for mobile conversation viewing

```scss
// Solution: Mobile-optimized conversation layout
.conversation-box {
  @media (max-width: 768px) {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
    background: white;

    .conversation-turns {
      padding: 1rem;
      font-size: 1.1rem; // Larger text for mobile
      line-height: 1.6;
    }

    .playback-controls {
      position: sticky;
      bottom: 0;
      background: white;
      border-top: 1px solid #eee;
      padding: 1rem;
    }
  }
}
```

## Testing Implementation

- Unit tests for all components using React Testing Library
- Integration tests with mocked scaffolder responses
- Accessibility tests for keyboard navigation and screen readers
- Visual regression tests for different conversation lengths
- Audio playback tests using mock HTML5 audio elements
