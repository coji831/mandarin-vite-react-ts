/**
 * @file HubCharacterCard.tsx
 * @description Character Detail Hub — Center card with character hero, stroke animation, controls
 * Story 18.5: Character Detail Hub (Phase 1 Minimal)
 *
 * Phase A skeleton: Renders the character as the hero with placeholder for stroke animation,
 * playback controls row, and audio button — all inside the center card.
 * Per wireframe: stroke animation plays IN the character box.
 *
 * Phase B: useHanziWriter integration renders real stroke animation on the canvas div.
 */

import { useHanziWriter } from "features/foundations/hooks";
import { useCallback } from "react";
import { useAudioPlayback } from "shared/hooks";

type HubCharacterCardProps = {
  character: string;
  pinyin: string | null;
};

export function HubCharacterCard({ character, pinyin }: HubCharacterCardProps) {
  const {
    canvasRef,
    isReady,
    error,
    currentStroke,
    totalStrokes,
    isPlaying,
    handlePlay,
    handlePause,
    handleStepBack,
    handleStepForward,
  } = useHanziWriter(character);
  const { playWordAudio } = useAudioPlayback();

  const handleAudioClick = useCallback(
    () => playWordAudio({ chinese: character, fallbackToBrowserTTS: true }),
    [character, playWordAudio],
  );

  return (
    <div className="hub-character-card">
      {/* Canvas container with overlay pattern */}
      <div className="hub-character-canvas">
        {/* The canvas div — always rendered, ref attaches here */}
        <div
          ref={canvasRef}
          className={`hub-character-canvas-inner ${isReady ? "hub-character-canvas-ready" : "hub-character-canvas-hidden"}`}
        />
        {/* Placeholder character shown when not ready and no error */}
        {!isReady && !error && <span className="hub-character-hanzi">{character}</span>}
        {/* Error overlay */}
        {error && (
          <div className="hub-character-canvas-overlay">
            <span className="hub-character-canvas-error">{error}</span>
          </div>
        )}
      </div>

      {/* Stroke info — real data */}
      <span className="hub-stroke-info">
        {isReady && totalStrokes > 0
          ? isPlaying
            ? "Animating..."
            : `Stroke ${currentStroke} of ${totalStrokes}`
          : "Loading..."}
      </span>

      {/* Pinyin row: pinyin text + audio button side by side */}
      <div className="hub-pinyin-row">
        <div className="hub-card-pinyin">{pinyin || "..."}</div>
        <button
          className="hub-audio-btn"
          onClick={handleAudioClick}
          disabled={!character}
          title="Play pronunciation"
          aria-label="Play pronunciation"
        >
          🔊
        </button>
      </div>

      {/* Controls row: step back, play, step forward */}
      <div className="hub-controls-row">
        <button
          className="hub-ctrl-btn"
          onClick={handleStepBack}
          disabled={!isReady || currentStroke <= 0}
          title="Step back"
          aria-label="Step back"
        >
          ◀
        </button>
        {isPlaying ? (
          <button
            className="hub-ctrl-btn hub-ctrl-play"
            onClick={handlePause}
            disabled={!isReady}
            title="Pause"
            aria-label="Pause"
          >
            ⏸
          </button>
        ) : (
          <button
            className="hub-ctrl-btn hub-ctrl-play"
            onClick={handlePlay}
            disabled={!isReady}
            title="Play stroke"
            aria-label="Play stroke animation"
          >
            ▶
          </button>
        )}
        <button
          className="hub-ctrl-btn"
          onClick={handleStepForward}
          disabled={!isReady || currentStroke >= totalStrokes}
          title="Step forward"
          aria-label="Step forward"
        >
          ▶
        </button>
      </div>
    </div>
  );
}
