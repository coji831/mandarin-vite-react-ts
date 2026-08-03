/**
 * @file HubReadings.tsx
 * @description Character Detail Hub — East zone: all readings with audio + stats
 *
 * Lists all readings (pinyin + tone + core meaning), each with an audio button.
 * Also shows frequency rank.
 * Supports loading skeleton state.
 * Fetches detail data independently via useCharacterDetail hook.
 */

import { useCallback } from "react";
import { useAudioItemPlayback } from "shared/hooks";
import { Button, Skeleton } from "shared/components";
import { useCharacterDetail } from "../../hooks";
import { getToneClass } from "../../utils/toneUtils";
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

export function HubReadings({
  glyph,
  readings: propReadings,
  frequencyRank: propFreqRank,
  loading: propLoading,
}: HubReadingsProps) {
  const { data } = useCharacterDetail(glyph ?? "");
  const { play } = useAudioItemPlayback();

  // Use prop data if provided (Storybook), otherwise self-fetched data
  const readings =
    propReadings ??
    data?.readings?.map((r) => ({
      pinyin: r.pinyin,
      tone: r.tone,
      type: r.type,
      coreMeaning: r.core_meaning,
    })) ??
    null;
  const frequencyRank = propFreqRank ?? data?.frequencyRank;
  const loading = propLoading ?? (!propReadings && !data);

  const handleAudio = useCallback(
    (_pinyin: string) => {
      if (glyph) {
        play(glyph);
      }
    },
    [glyph, play],
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
