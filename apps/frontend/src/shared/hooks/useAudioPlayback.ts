/**
 * useAudioPlayback hook
 *
 * - Provides audio playback logic for Mandarin vocabulary and conversation turns.
 * - Supports backend audio (TTS) and browser TTS fallback.
 * - Exposes playWordAudio, playTurnAudio, pauseAudio, and playback state (isPlaying, isLoading, error).
 * - Used by ConversationTurns and other components for per-turn and per-word audio.
 * - Handles audio loading, error state, and ensures only one audio plays at a time.
 *
 * Usage:
 *   const { playTurnAudio, isPlaying, isLoading, error, pauseAudio } = useAudioPlayback();
 *
 * See also: AudioService, ConversationTurns
 */
import { useRef, useState } from "react";

import { API_CONFIG } from "config";
import { AudioService } from "../services/audio";
import type { WordAudio, WordAudioRequest } from "../services/audio/types";

export function useAudioPlayback() {
  const [audioData, setAudioData] = useState<WordAudio | { audioUrl?: string } | null>(null);
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
      // Pick a zh-CN voice explicitly for better pronunciation quality
      const voices = window.speechSynthesis.getVoices();
      const zhVoice = voices.find((v) => v.lang.startsWith("zh"));
      if (zhVoice) utter.voice = zhVoice;
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
    onAudioUrlGenerated,
  }: {
    backendFetch: () => Promise<WordAudio | { audioUrl?: string }>;
    fallbackText: string;
    fallbackToBrowserTTS?: boolean;
    onAudioUrlGenerated?: (audioUrl: string) => void;
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
      if (url.startsWith("/")) {
        url = `${API_CONFIG.baseURL}${url}`;
      }
      if (onAudioUrlGenerated) onAudioUrlGenerated(url);
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

  // Create AudioService once per hook instance
  const audioServiceRef = useRef<AudioService | null>(null);
  if (!audioServiceRef.current) {
    audioServiceRef.current = new AudioService();
  }
  const audioService = audioServiceRef.current;

  // Word audio
  async function playWordAudio(params: {
    chinese: string;
    voice?: string;
    bitrate?: number;
    fallbackToBrowserTTS?: boolean;
  }) {
    await playAudio({
      backendFetch: () => audioService.fetchWordAudio(params as WordAudioRequest),
      fallbackText: params.chinese,
      fallbackToBrowserTTS: params.fallbackToBrowserTTS,
    });
  }

  // Play audio for a specific turn
  async function playTurnAudio(params: {
    wordId: string;
    turnIndex: number;
    text: string;
    voice?: string;
    fallbackToBrowserTTS?: boolean;
  }) {
    setIsLoading(true);
    setError(null);
    try {
      const { audioUrl } = await audioService.fetchTurnAudio({
        wordId: params.wordId,
        turnIndex: params.turnIndex,
        text: params.text,
        voice: params.voice,
      });
      let url = audioUrl;
      if (!url) throw new Error("No audioUrl for this turn");
      if (url.startsWith("/")) {
        url = `${API_CONFIG.baseURL}${url}`;
      }
      await playBackendAudio(url);
      setIsPlaying(true);
    } catch (err) {
      if (!params.fallbackToBrowserTTS) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setIsLoading(false);
        return;
      }
      playBrowserTTS(params.text || "");
    } finally {
      setIsLoading(false);
    }
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
    playTurnAudio,
    pauseAudio,
    isLoading,
    error,
  };
}
