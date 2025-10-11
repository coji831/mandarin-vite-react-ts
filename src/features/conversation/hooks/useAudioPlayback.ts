import { useRef, useState } from "react";

import { requestAudio } from "../services";
import type { ConversationAudio } from "../types";

export function useAudioPlayback() {
  const [audioData, setAudioData] = useState<ConversationAudio | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTurn, setCurrentTurn] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function playAudio(params: { conversationId: string; voice?: string; bitrate?: number }) {
    setIsLoading(true);
    setError(null);
    try {
      const audio = await requestAudio(params);
      setAudioData(audio);
      setIsPlaying(true);
      setCurrentTurn(0); // Start at first turn

      // Play audio in browser
      if (audio.audioUrl) {
        // Use absolute URL for local backend during development
        let audioUrl = audio.audioUrl;
        if (
          audioUrl.startsWith("/") &&
          typeof window !== "undefined" &&
          window.location.hostname === "localhost"
        ) {
          audioUrl = `http://localhost:3001${audioUrl}`;
        }
        // Clean up previous audio
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        audioRef.current = new window.Audio(audioUrl);
        audioRef.current.play();
        // Optionally, handle timeline updates here
        audioRef.current.onended = () => {
          setIsPlaying(false);
        };
      }
    } catch (err) {
      console.log(err);

      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }

  function pauseAudio() {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }

  return {
    audioData,
    isPlaying,
    currentTurn,
    playAudio,
    pauseAudio,
    isLoading,
    error,
  };
}
