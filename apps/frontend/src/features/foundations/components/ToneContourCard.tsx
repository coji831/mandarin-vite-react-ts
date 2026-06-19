/**
 * @file components/ToneContourCard.tsx
 * @description Tone contour card with SVG pitch visualization and audio playback
 * Story 18.3: Tones Reference & Practice
 *
 * Renders a card for a single Mandarin tone with:
 * - SVG pitch contour visualization (5-point contour mapped to path)
 * - Tone mark with TONE_COLORS coloring
 * - Example pinyin and character
 * - Description text
 * - Play button for pronunciation
 */

import { TONE_COLORS } from "../utils/pinyinUtils";
import type { ToneDefinition } from "../types";

export interface ToneContourCardProps {
  tone: ToneDefinition;
  onPlay: (pinyin: string) => void;
  isLoading?: boolean;
}

/**
 * Build an SVG path string from contour data points.
 * Each contour value (0-5) is mapped to a y-coordinate where
 * 0 = top of SVG and 5 = bottom of SVG.
 * x-coordinates are evenly spaced across the viewBox width.
 */
function buildContourPath(contour: number[]): string {
  const width = 100;
  const height = 100;
  const padding = 10;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  if (contour.length === 0) return "";

  const points = contour.map((value, index) => {
    const x = padding + (index / (contour.length - 1)) * innerWidth;
    // Map pitch value (0-5) to y-coordinate: 0 = top, 5 = bottom
    const y = padding + innerHeight - (value / 5) * innerHeight;
    return `${x},${y}`;
  });

  return `M${points.join(" L")}`;
}

const TONE_SHORT_NAMES: Record<number, string> = {
  1: "1st",
  2: "2nd",
  3: "3rd",
  4: "4th",
  0: "Neut",
};

export function ToneContourCard({ tone, onPlay, isLoading = false }: ToneContourCardProps) {
  const contourPath = buildContourPath(tone.contour);
  const toneColor = TONE_COLORS[tone.number] ?? tone.color;
  const shortName = TONE_SHORT_NAMES[tone.number] ?? tone.name;

  return (
    <div className="tone-contour-card">
      {/* Tone Info — wireframe order: name: mark pinyin (description) chinese */}
      <div className="tone-contour-info">
        <span className="tone-contour-mark" style={{ color: toneColor }}>
          {shortName}:
        </span>
        <span className="tone-contour-symbol" style={{ color: toneColor }}>
          {tone.mark}
        </span>
        <span className="tone-contour-pinyin" style={{ color: toneColor }}>
          {tone.pinyinExample}
        </span>
        <span className="tone-contour-description">({tone.description.toLowerCase()})</span>
        <span className="tone-contour-chinese">{tone.chineseExample}</span>
      </div>

      {/* SVG Pitch Contour — moved to right side */}
      <svg
        className="tone-contour-svg"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        aria-label={`${tone.name} pitch contour`}
      >
        {/* Background grid lines */}
        <line x1="10" y1="10" x2="10" y2="90" stroke="#3a3a5e" strokeWidth="0.5" />
        <line
          x1="10"
          y1="50"
          x2="90"
          y2="50"
          stroke="#3a3a5e"
          strokeWidth="0.5"
          strokeDasharray="2,2"
        />
        <line x1="90" y1="10" x2="90" y2="90" stroke="#3a3a5e" strokeWidth="0.5" />
        {/* Contour path */}
        <path
          d={contourPath}
          fill="none"
          stroke={toneColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Data points */}
        {tone.contour.map((value, index) => {
          const padding = 10;
          const innerWidth = 100 - padding * 2;
          const innerHeight = 100 - padding * 2;
          const x = padding + (index / (tone.contour.length - 1)) * innerWidth;
          const y = padding + innerHeight - (value / 5) * innerHeight;
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="3"
              fill={toneColor}
              stroke="#1a1a2e"
              strokeWidth="1"
            />
          );
        })}
      </svg>

      <button
        className="tone-contour-play-btn"
        onClick={() => onPlay(tone.pinyinExample)}
        disabled={isLoading}
        title={isLoading ? "Generating audio..." : `Play ${tone.pinyinExample}`}
        aria-label={`Play ${tone.pinyinExample}`}
      >
        {isLoading ? <span className="tones-loading-spinner" /> : "▶"}
      </button>
    </div>
  );
}
