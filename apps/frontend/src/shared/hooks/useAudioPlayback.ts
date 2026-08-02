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
 *
 * Phase 3: Uses shared AudioEngine and BrowserTTS classes instead of inline implementations.
 */
import { useRef, useState } from "react";

import { API_CONFIG } from "config";
import { AudioService } from "../services/audio";
import { AudioEngine } from "../lib/audioEngine";
import { BrowserTTS } from "../lib/browserTTS";
import type { WordAudio, WordAudioRequest } from "../services/audio/types";

export function useAudioPlayback() {
  const [audioData, setAudioData] = useState<WordAudio | { audioUrl?: string } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTurn, setCurrentTurn] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stable class instances (not hooks — plain classes)
  const audioEngineRef = useRef<AudioEngine>(new AudioEngine());
  const browserTTSRef = useRef<BrowserTTS>(new BrowserTTS());

  // Function to play audio using browser TTS as fallback
  function playBrowserTTS(text: string) {
    if (!text) {
      setError("No text provided for browser TTS.");
      return;
    }
    browserTTSRef.current.speak(text, 1, "zh-CN").then(() => {
      setError(null);
      setIsPlaying(false);
    });
  }

  // Function to play audio from backend URL
  async function playBackendAudio(audioUrl: string) {
    await audioEngineRef.current.playUrl(audioUrl, 1);
    setIsPlaying(false);
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
    audioEngineRef.current.stop();
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
