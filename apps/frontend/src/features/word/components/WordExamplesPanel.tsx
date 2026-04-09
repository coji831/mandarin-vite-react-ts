import { useState, useEffect } from "react";
import useExamples from "../hooks/useExamples";
import ExampleListItem from "./ExampleListItem";
import "../styles/WordExamples.css";
import * as analyticsService from "../../../services/analyticsService";
import * as audioService from "../../../services/audioService";
import { getCacheKey } from "../../../services/examplesApi";

type WordExamplesPanelProps = {
  word: string;
  hskLevel: number;
  language?: string;
};

export function WordExamplesPanel({ word, hskLevel, language = "en" }: WordExamplesPanelProps) {
  const { data: examples, isLoading, error, cacheHit } = useExamples(word, hskLevel, language);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (examples && !isLoading) {
      analyticsService.trackExamplesShown(cacheHit);
    }
  }, [examples, isLoading, cacheHit]);

  const handlePlayClick = async (index: number) => {
    setPlayingIndex(index);
    try {
      const key = await getCacheKey(word, hskLevel, language);
      const audioUrl = await audioService.getAudioUrl(key);
      await audioService.playAudio(audioUrl);
      analyticsService.trackExamplePlayed(index, cacheHit);
    } finally {
      setPlayingIndex(null);
    }
  };

  if (isLoading) {
    return (
      <div className="examples-panel">
        <ul role="list" className="examples-list skeleton">
          {[0, 1, 2].map((i) => (
            <li key={i} role="listitem" className="skeleton-item" />
          ))}
        </ul>
      </div>
    );
  }

  if (error) {
    return (
      <div className="examples-panel error">
        <p>Failed to load examples: {error.message}</p>
      </div>
    );
  }

  if (!examples || examples.length === 0) {
    return <div className="examples-panel empty">No examples available.</div>;
  }

  const displayExamples = examples.slice(0, 5);

  return (
    <div className="examples-panel">
      <ul role="list" className="examples-list">
        {displayExamples.map((example, index) => (
          <ExampleListItem
            key={index}
            example={example}
            index={index}
            onPlayClick={async (i, _ex) => handlePlayClick(i)}
            isPlaying={playingIndex === index}
          />
        ))}
      </ul>
      {examples.length > 5 && (
        <button className="more-button" aria-expanded="false">
          Show {examples.length - 5} more
        </button>
      )}
    </div>
  );
}

export default WordExamplesPanel;
