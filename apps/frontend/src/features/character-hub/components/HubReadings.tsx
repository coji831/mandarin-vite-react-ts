/**
 * @file HubReadings.tsx
 * @description Character Detail Hub — East zone: all readings with audio + stats
 *
 * Lists all readings (pinyin + tone + core meaning), each with an audio button.
 * Also shows frequency rank.
 * Supports loading skeleton state.
 */

import { useCallback } from "react";
import { useAudioPlayback } from "shared/hooks";
import { Button, Skeleton } from "shared/components";
import "./HubReadings.css";

export type ReadingInfo = {
  pinyin: string;
  tone: number;
  type: string;
  coreMeaning: string;
};

export type HubReadingsProps = {
  glyph?: string;
  readings?: ReadingInfo[];
  frequencyRank?: number;
  loading?: boolean;
};

function getToneClass(tone: number): string {
  const classes: Record<number, string> = {
    1: "tone-1",
    2: "tone-2",
    3: "tone-3",
    4: "tone-4",
    0: "text-tertiary",
  };
  return classes[tone] ?? "text-tertiary";
}

export function HubReadings({ glyph, readings, frequencyRank, loading }: HubReadingsProps) {
  const { playWordAudio } = useAudioPlayback();

  const handleAudio = useCallback(
    (_pinyin: string) => {
      if (glyph) {
        playWordAudio({ chinese: glyph, fallbackToBrowserTTS: true });
      }
    },
    [glyph, playWordAudio],
  );

  if (loading) {
    return (
      <div className="hub-readings flex-col gap-sm" role="status" aria-label="Loading readings">
        <h3 className="font-sm text-secondary text-uppercase tracking-wide m-0">Readings</h3>
        <Skeleton variant="line" height="14px" />
        <Skeleton variant="line" height="14px" width="70%" />
        <Skeleton variant="line" height="12px" width="50%" />
      </div>
    );
  }

  if (!readings || readings.length === 0) return null;

  return (
    <div className="hub-readings flex-col gap-sm">
      <h3 className="font-sm text-secondary text-uppercase tracking-wide m-0">Readings</h3>
      <div className="flex-col gap-sm">
        {readings.map((r, i) => (
          <Button
            key={i}
            variant="ghost"
            size="sm"
            className="hub-reading-btn w-full flex justify-between items-center gap-sm"
            onClick={() => handleAudio(r.pinyin)}
            title={`Play ${r.pinyin}`}
            aria-label={`Play pronunciation for ${r.pinyin}`}
          >
            <div className="w-full flex items-center justify-between">
              <span className="hub-reading-left flex-col items-start gap-xs">
                <span className="flex gap-xs items-center">
                  <span className={`font-sm fw-500 ${getToneClass(r.tone)}`}>{r.pinyin}</span>
                  <span className="font-xs text-muted">{r.coreMeaning}</span>
                </span>
                <span className="font-xs text-subtle text-left">({r.type})</span>
              </span>
              <span>🔊</span>
            </div>
          </Button>
        ))}
      </div>
      {frequencyRank !== undefined && (
        <p className="font-xs text-muted m-0">Frequency rank: #{frequencyRank}</p>
      )}
    </div>
  );
}
