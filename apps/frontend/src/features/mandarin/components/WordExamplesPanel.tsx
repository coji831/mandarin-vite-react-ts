/**
 * WordExamplesPanel component
 *
 * - Displays a list of example sentences using a given Mandarin word.
 * - Handles example fetching, loading, and error states.
 * - Per-example audio playback with visual feedback (playing/loading indicators).
 * - Styled to match ConversationBox design pattern: dark background, left border indicators, animations.
 *
 * Usage:
 *   <WordExamplesPanel word={...} hskLevel={...} language="en" />
 *
 * See also: useExamples, ExampleListItem
 */
import { useState, useEffect, useRef } from "react";

import "../styles/WordExamples.css";
import * as analyticsService from "../../../services/analyticsService";
import useExamples from "../hooks/useExamples";
import { AudioService } from "../services";
import { getCacheKey } from "../../../services/examplesApi";
import { API_CONFIG } from "config";
import ExampleListItem from "./ExampleListItem";
import type { Example } from "../../../services/examplesApi";

type WordExamplesPanelProps = {
  wordId: string; // Database word ID
  word: string;
  hskLevel: number;
  language?: string;
};

export function WordExamplesPanel({
  wordId,
  word,
  hskLevel,
  language = "en",
}: WordExamplesPanelProps) {
  const { data: examples, isLoading, error, cacheHit } = useExamples(word, hskLevel, language);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (examples && !isLoading) {
      analyticsService.trackExamplesShown(cacheHit);
    }
  }, [examples, isLoading, cacheHit]);

  const handlePlayClick = async (index: number, example: Example) => {
    setActiveIndex(index);
    setPlayingIndex(index);
    setLoadingIndex(index);
    const svc = new AudioService();
    try {
      const cacheKey = await getCacheKey(word, hskLevel, language);
      const { audio_url, audioUrl } = (await svc.fetchExampleAudio(cacheKey)) as any;
      let url = audio_url ?? audioUrl ?? "";
      if (!url) throw new Error("No audio URL returned");
      if (url.startsWith("/")) {
        url = `${API_CONFIG.baseURL}${url}`;
      }

      // Create audio element and play, manage playing state until ended
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setPlayingIndex(null);
        setLoadingIndex(null);
        audioRef.current = null;
      };
      // Start playback
      await audio.play();
      // Playback started, clear loading
      setLoadingIndex(null);
      analyticsService.trackExamplePlayed(index, cacheHit);
    } catch (err) {
      console.error("Example playback failed", err);
      setLoadingIndex(null);
      setPlayingIndex(null);
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch {
          /* ignore */
        }
        audioRef.current = null;
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="examples-panel">
        <div className="examples-panel__content">
          <ul role="list" className="examples-list skeleton">
            {[0, 1, 2].map((i) => (
              <li key={i} role="listitem" className="skeleton-item" />
            ))}
          </ul>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="examples-panel">
        <div className="examples-panel__content examples-panel__error">
          <p>Failed to load examples: {error.message}</p>
        </div>
      </div>
    );
  }

  if (!examples || examples.length === 0) {
    return (
      <div className="examples-panel">
        <div className="examples-panel__content examples-panel__empty">No examples available.</div>
      </div>
    );
  }

  const displayExamples = examples ? examples.slice(0, 5) : [];

  return (
    <div className="examples-panel">
      <div className="examples-panel__content">
        <ul role="list" className="examples-list">
          {displayExamples.map((example, index) => {
            const isTurnActive = activeIndex === index;
            const isTurnLoading = loadingIndex === index;
            const isTurnPlaying = playingIndex === index && loadingIndex !== index;
            return (
              <ExampleListItem
                key={index}
                example={example}
                index={index}
                onPlayClick={async (i, ex) => handlePlayClick(i, ex)}
                isPlaying={isTurnPlaying}
                isLoading={isTurnLoading}
                isActive={isTurnActive}
              />
            );
          })}
        </ul>
        {examples.length > 5 && (
          <button className="examples-panel__more-button" aria-expanded="false">
            Show {examples.length - 5} more
          </button>
        )}
      </div>
    </div>
  );
}

export default WordExamplesPanel;
