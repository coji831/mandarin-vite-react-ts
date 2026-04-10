/**
 * ExampleListItem component
 *
 * - Renders a single example sentence with Chinese, pinyin, and English translation.
 * - Handles audio playback with visual feedback (playing/loading indicators).
 * - Styled to match ConversationTurn pattern: left border indicator, hover/playing states, animations.
 *
 * Usage:
 *   <ExampleListItem example={...} index={...} onPlayClick={...} isPlaying={...} />
 *
 * See also: WordExamplesPanel, useAudioPlayback
 */
import { useState } from "react";
import type { Example } from "../../../services/examplesApi";

type ExampleListItemProps = {
  example: Example;
  index: number;
  onPlayClick: (index: number, example: Example) => Promise<void>;
  isPlaying?: boolean;
  isLoading?: boolean;
  isActive?: boolean;
};

export function ExampleListItem({
  example,
  index,
  onPlayClick,
  isPlaying = false,
  isLoading = false,
  isActive = false,
}: ExampleListItemProps) {
  const [playError, setPlayError] = useState<string | null>(null);

  const handlePlay = async () => {
    setPlayError(null);
    try {
      await onPlayClick(index, example);
    } catch (err) {
      setPlayError(err instanceof Error ? err.message : "Playback failed");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handlePlay();
    }
  };

  return (
    <li
      role="listitem"
      className={`example-item${isActive ? " current" : ""}${isPlaying ? " playing" : ""}`}
      onClick={handlePlay}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label={`Example ${index + 1}: ${example.chinese}`}
      title="Click to play audio"
    >
      {/* Example number badge (like speaker) */}
      <span className="example-item__number" aria-hidden="true">
        {index + 1}
      </span>

      {/* Content area */}
      <div className="example-item__content">
        <p className="example-item__text">{example.chinese}</p>
        {example.pinyin && (
          <p className="example-item__pinyin" title="Pinyin">
            {example.pinyin}
          </p>
        )}
        {example.english && <p className="example-item__translation">{example.english}</p>}
      </div>

      {/* Audio indicator (playing/loading) */}
      {isPlaying && (
        <span className="audio-playing-indicator" aria-label="Audio playing">
          🔊
        </span>
      )}
      {isLoading && (
        <span className="audio-loading-indicator" aria-label="Loading audio">
          ⏳
        </span>
      )}

      {/* Error message */}
      {playError && <div className="example-item__error">{playError}</div>}
    </li>
  );
}

export default ExampleListItem;
