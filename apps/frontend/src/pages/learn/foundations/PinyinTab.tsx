/**
 * @file PinyinTab.tsx
 * @description Interactive pinyin chart with a 2D sliding pinyin grid showing all initial×final
 *              combinations at once. Replaces the two-step InitialsGrid → FinalsGrid flow.
 * Story 18.2: Pinyin System Guide
 *
 * Mounted inside FoundationsPage.tsx when activeTab === "pinyin".
 * Loads pinyin.json data on mount and caches it in a module-level variable.
 */

import { useEffect, useRef, useState } from "react";

import type { PinyinTonesPool } from "features/foundations";
import {
  foundationsService,
  SlidingPinyinGrid,
  TONE_LABELS,
  TONE_SYMBOLS,
} from "features/foundations";
import { Box, ErrorScreen, LoadingScreen } from "shared/components";
import { usePinyinCharacterMap } from "shared/hooks";
import "./PinyinTab.css";

/** Count valid combinations in the pool */
function countValidCombinations(combinations: PinyinTonesPool["combinations"]): number {
  let count = 0;
  for (const c of combinations) {
    if (c.tones.some((t) => t !== null)) count++;
  }
  return count;
}

const TONE_BOX_VARIANTS = ["tone-1", "tone-2", "tone-3", "tone-4", "tone-5"] as const;

export function PinyinTab() {
  const [data, setData] = useState<PinyinTonesPool | null>(null);
  const [hasError, setHasError] = useState(false);
  const fetchAttempted = useRef(false);
  // Shared pinyin → Hanzi map (cross-feature, one deduped fetch). Non-fatal: a
  // failed map load leaves charMap null and the grid simply skips pinyin TTS.
  const { charMap } = usePinyinCharacterMap();

  // Fetch pinyin reference data on mount (once)
  useEffect(() => {
    if (fetchAttempted.current) return;
    fetchAttempted.current = true;

    const loadData = async () => {
      try {
        const pool = await foundationsService.getPinyinTonesPool();
        setData(pool);
      } catch {
        // Failed to load pinyin data — error state shown
        fetchAttempted.current = false; // Allow retry
        setHasError(true);
      }
    };
    loadData();
  }, []);

  if (hasError) {
    return (
      <ErrorScreen
        error="Failed to load pinyin data"
        onRetry={() => {
          fetchAttempted.current = false;
          setHasError(false);
          setData(null);
        }}
      />
    );
  }

  if (!data) {
    return <LoadingScreen message="Loading pinyin data..." />;
  }

  const validComboCount = countValidCombinations(data.combinations);

  return (
    <div className="pinyin-tab flex-col gap-sm mx-auto">
      {/* Section A: Intro header */}
      <Box variant="dark" padding="md" className="pinyin-tab-header flex-col gap-xs">
        <h2 className="font-xl fw-700 text-secondary m-0">Pinyin Reference Guide</h2>
        <p className="font-sm text-muted m-0">
          {data.initials.length} initials &times; {data.finals.length} finals = ~{validComboCount}{" "}
          valid combinations
        </p>
        <p className="font-sm text-muted m-0">Tap any cell to hear pronunciation and see details</p>
      </Box>

      {/* Section B: Tone color legend */}
      <div className="flex flex-wrap gap-xs">
        {[1, 2, 3, 4, 0].map((toneNum) => {
          const toneCss = toneNum === 0 ? 5 : toneNum;
          return (
            <Box
              key={toneNum}
              variant={TONE_BOX_VARIANTS[toneCss - 1]}
              className="pinyin-tab-legend-chip inline-flex items-center radius-pill bg-surface-dark lh-1 gap-4px"
              title={TONE_LABELS[toneNum]}
            >
              <span className="font-sm fw-600">{TONE_SYMBOLS[toneNum]}</span>
              <span className="font-xs">{TONE_LABELS[toneNum]}</span>
            </Box>
          );
        })}
      </div>

      <SlidingPinyinGrid
        initials={data.initials}
        finals={data.finals}
        combinations={data.combinations}
        charMap={charMap}
      />

      {/* Section C: Pronunciation tip callout */}
      <Box variant="dark" padding="md" className="pinyin-tab-tip">
        <div className="flex-center gap-xs pinyin-tab-tip-header">
          <span className="font-lg">💡</span>
          <span className="font-sm fw-600 text-secondary">Tip:</span>
        </div>
        <p className="font-sm text-tertiary mt-xs">
          j/q/x are pronounced with the tongue behind your lower teeth, unlike zh/ch/sh which curl
          the tongue to the roof of the mouth.
        </p>
      </Box>
    </div>
  );
}
