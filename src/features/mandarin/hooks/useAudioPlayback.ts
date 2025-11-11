import { useRef, useState } from "react";

import { AudioService } from "../services";
import type {
  WordAudio,
  ConversationAudio,
  ConversationAudioRequest,
  WordAudioRequest,
} from "../types";

export function useAudioPlayback() {
  const [audioData, setAudioData] = useState<
    WordAudio | ConversationAudio | { audioUrl?: string } | null
  >(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTurn, setCurrentTurn] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Function to play audio using browser TTS as fallback
  function playBrowserTTS(text: string) {
    if (!text) {
      setError("No text provided for browser TTS.");
      return;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utter = new window.SpeechSynthesisUtterance(text);
      utter.lang = "zh-CN";
      window.speechSynthesis.speak(utter);
      setError(null);
      setIsPlaying(false);
    } else {
      setError("Browser TTS not supported.");
    }
  }

  // Function to play audio from backend URL
  async function playBackendAudio(audioUrl: string) {
    // Stop any existing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    audioRef.current = new window.Audio();
    audioRef.current.src = audioUrl;
    audioRef.current.load();
    await audioRef.current.play();
    audioRef.current.onended = () => setIsPlaying(false);
  }

  // Generalized function to fetch and play audio with fallback
  async function playAudio({
    backendFetch,
    fallbackText,
    fallbackToBrowserTTS = true,
  }: {
    backendFetch: () => Promise<WordAudio | ConversationAudio>;
    fallbackText: string;
    fallbackToBrowserTTS?: boolean;
  }) {
    setIsLoading(true);
    setError(null);
    try {
      const audio = await backendFetch();
      setAudioData(audio);
      setIsPlaying(true);
      setCurrentTurn(0);
      if (!audio.audioUrl) throw new Error("No audioUrl returned from backend");

      let url = audio.audioUrl;
      if (
        url.startsWith("/") &&
        typeof window !== "undefined" &&
        window.location.hostname === "localhost"
      ) {
        url = `http://localhost:3001${url}`;
      }
      await playBackendAudio(url);
    } catch (err) {
      if (!fallbackToBrowserTTS) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setIsLoading(false);
        return;
      }
      playBrowserTTS(fallbackText);
    } finally {
      setIsLoading(false);
    }
  }

  // Word audio
  async function playWordAudio(params: {
    chinese: string;
    voice?: string;
    bitrate?: number;
    fallbackToBrowserTTS?: boolean;
  }) {
    const audioService = new AudioService();
    await playAudio({
      backendFetch: () => audioService.fetchWordAudio(params as WordAudioRequest),
      fallbackText: params.chinese,
      fallbackToBrowserTTS: params.fallbackToBrowserTTS,
    });
  }

  // Conversation audio
  async function playConversationAudio(params: {
    wordId: string;
    voice?: string;
    bitrate?: number;
    fallbackToBrowserTTS?: boolean;
    fallbackText?: string;
  }) {
    const audioService = new AudioService();
    const backendFetch = () =>
      audioService.fetchConversationAudio(params as ConversationAudioRequest);
    const fallbackText = params.fallbackText || "";
    const fallbackToBrowserTTS = params.fallbackToBrowserTTS;
    await playAudio({ backendFetch, fallbackText, fallbackToBrowserTTS });
  }

  // General pause function
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
    playWordAudio,
    playConversationAudio,
    pauseAudio,
    isLoading,
    error,
  };
}
