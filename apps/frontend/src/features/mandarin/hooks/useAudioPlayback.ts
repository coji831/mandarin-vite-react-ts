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
import { AudioService } from "../services";
import type { ConversationAudio, WordAudio, WordAudioRequest } from "../types";

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
    onAudioUrlGenerated,
  }: {
    backendFetch: () => Promise<WordAudio | ConversationAudio>;
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
      const audioService = new AudioService();
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
