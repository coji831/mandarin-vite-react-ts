import { useState } from "react";
import type { Example } from "../../../services/examplesApi";

type ExampleListItemProps = {
  example: Example;
  index: number;
  onPlayClick: (index: number, example: Example) => Promise<void>;
  isPlaying?: boolean;
};

export function ExampleListItem({
  example,
  index,
  onPlayClick,
  isPlaying = false,
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

  return (
    <li role="listitem" className="example-item">
      <div className="example-content">
        <div className="chinese">{example.chinese}</div>
        <div className="pinyin">{example.pinyin}</div>
        <div className="english">{example.english}</div>
      </div>
      <button
        className="play-button"
        onClick={handlePlay}
        disabled={isPlaying}
        aria-label={`Play example ${index + 1}: ${example.chinese}`}
        title="Play audio"
      >
        {isPlaying ? "⏸️" : "🔊"}
      </button>
      {playError && <div className="error-message">{playError}</div>}
    </li>
  );
}

export default ExampleListItem;
