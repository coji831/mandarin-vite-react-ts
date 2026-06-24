/**
 * @file PinyinTab.tsx
 * @description Interactive pinyin chart with initials/finals grids, tone-colored combination display,
 *              and TTS audio integration via useAudioPlayback.
 * Story 18.2: Pinyin System Guide
 *
 * Mounted inside FoundationsPage.tsx when activeTab === "pinyin".
 * Loads pinyin.json data on mount and caches it in a module-level variable.
 * Allows selecting an initial + final to see tone-colored combinations with audio playback.
 */

import { useEffect, useRef, useState } from "react";

import { useAudioPlayback } from "shared/hooks";
import {
  CombinationDisplay,
  FinalsGrid,
  InitialsGrid,
  foundationsService,
} from "features/foundations";
import type { PinyinTonesPool } from "features/foundations";
import { getCombination } from "features/foundations/utils";
import "./PinyinTab.css";

export function PinyinTab() {
  const [data, setData] = useState<PinyinTonesPool | null>(null);
  const [selectedInitial, setSelectedInitial] = useState<string | null>(null);
  const [selectedFinal, setSelectedFinal] = useState<string | null>(null);
  const [loadingPinyin, setLoadingPinyin] = useState<string | null>(null);
  const [charMap, setCharMap] = useState<Record<string, string>>({});
  const { playWordAudio } = useAudioPlayback();
  const fetchAttempted = useRef(false);

  // Fetch pinyin.json data on mount (once) — cache lives in foundationsService
  useEffect(() => {
    if (fetchAttempted.current) return;
    fetchAttempted.current = true;

    const loadData = async () => {
      try {
        const pool = await foundationsService.getPinyinTonesPool();
        setData(pool);
      } catch (err) {
        console.error("[PinyinTab] Failed to load pinyin data:", err);
      }
    };
    loadData();
  }, []);

  // Fetch pinyin→character map for TTS audio (avoids per-click API call)
  useEffect(() => {
    const loadCharMap = async () => {
      try {
        const map = await foundationsService.getPinyinCharacterMap();
        setCharMap(map);
      } catch {
        // Non-critical: audio will still work via browser TTS fallback
      }
    };
    loadCharMap();
  }, []);

  // Compute the combination when both initial and final are selected
  const combination =
    data && selectedInitial && selectedFinal
      ? getCombination(selectedInitial, selectedFinal, data)
      : null;

  // Handle playing audio for a specific pinyin syllable
  // Uses pinyin-to-character mapping for better TTS quality
  const handlePlayTone = async (pinyin: string) => {
    setLoadingPinyin(pinyin);
    try {
      const audioText = charMap[pinyin] || pinyin;
      await playWordAudio({ chinese: audioText, fallbackToBrowserTTS: true });
    } catch (err) {
      console.warn(`[PinyinTab] Audio failed for "${pinyin}"`, err);
    } finally {
      setLoadingPinyin(null);
    }
  };

  // Handle initial selection: select and NOT play the initial sound
  const handleInitialSelect = (id: string) => {
    setSelectedInitial(id);
  };

  // Handle final selection
  const handleFinalSelect = (id: string) => {
    setSelectedFinal(id);
  };

  if (!data) {
    return (
      <div className="pinyin-tab pinyin-tab-loading font-lg flex-center text-muted">
        <p>Loading pinyin data...</p>
      </div>
    );
  }

  return (
    <div className="pinyin-tab flex-col gap-sm">
      <section className="flex-col">
        <h3 className="pinyin-section-heading font-md text-secondary fw-600 m-0">
          Initials (声母)
        </h3>
        <p className="pinyin-section-subtitle font-xs text-muted">
          Click an initial to hear its pronunciation
        </p>
        <InitialsGrid
          initials={data.initials}
          selected={selectedInitial}
          onSelect={handleInitialSelect}
        />
      </section>

      <section className="flex-col">
        <h3 className="pinyin-section-heading font-md text-secondary fw-600 m-0">Finals (韵母)</h3>
        <p className="pinyin-section-subtitle font-xs text-muted">
          Click a final to select it, then combine with an initial
        </p>
        <FinalsGrid finals={data.finals} selected={selectedFinal} onSelect={handleFinalSelect} />
      </section>

      <section className="flex-col">
        {combination ? (
          <CombinationDisplay
            initial={selectedInitial!}
            final={selectedFinal!}
            tones={combination.tones}
            onPlayTone={handlePlayTone}
            loadingPinyin={loadingPinyin}
          />
        ) : selectedInitial && selectedFinal ? (
          <div className="pinyin-combination-empty p-lg bg-surface-dark-alt border-default radius-md text-tertiary text-center">
            <p>
              No valid combination for{" "}
              <strong className="text-secondary">
                {selectedInitial}+{selectedFinal}
              </strong>
            </p>
          </div>
        ) : (
          <div className="pinyin-combination-hint p-lg font-italic text-muted text-center">
            <p>Select an initial and a final to see tone combinations</p>
          </div>
        )}
      </section>
    </div>
  );
}
