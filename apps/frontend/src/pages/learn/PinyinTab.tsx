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
import { CombinationDisplay, FinalsGrid, InitialsGrid } from "features/foundations";
import type { PinyinData } from "features/foundations/types";
import { getCombination, getPinyinAudioText } from "features/foundations/utils";
import "./PinyinTab.css";

// Module-level cache: data is fetched once and reused across tab switches
let cachedData: PinyinData | null = null;

export function PinyinTab() {
  const [data, setData] = useState<PinyinData | null>(cachedData);
  const [selectedInitial, setSelectedInitial] = useState<string | null>(null);
  const [selectedFinal, setSelectedFinal] = useState<string | null>(null);
  const [loadingPinyin, setLoadingPinyin] = useState<string | null>(null);
  const { playWordAudio, isLoading } = useAudioPlayback();
  const fetchAttempted = useRef(false);

  // Fetch pinyin.json data on mount (once)
  useEffect(() => {
    if (cachedData) {
      setData(cachedData);
      return;
    }
    if (fetchAttempted.current) return;
    fetchAttempted.current = true;

    const loadData = async () => {
      try {
        const response = await fetch("/data/foundations/pinyin.json");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json: PinyinData = await response.json();
        cachedData = json;
        setData(json);
      } catch (err) {
        console.error("Failed to load pinyin data:", err);
      }
    };
    loadData();
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
      const audioText = await getPinyinAudioText(pinyin);
      await playWordAudio({ chinese: audioText, fallbackToBrowserTTS: true });
    } catch (err) {
      console.warn(`Audio failed for "${pinyin}"`, err);
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
      <div className="pinyin-tab pinyin-tab-loading">
        <p>Loading pinyin data...</p>
      </div>
    );
  }

  return (
    <div className="pinyin-tab">
      <section className="pinyin-section">
        <h3 className="pinyin-section-heading">Initials (声母)</h3>
        <p className="pinyin-section-subtitle">Click an initial to hear its pronunciation</p>
        <InitialsGrid
          initials={data.initials}
          selected={selectedInitial}
          onSelect={handleInitialSelect}
        />
      </section>

      <section className="pinyin-section">
        <h3 className="pinyin-section-heading">Finals (韵母)</h3>
        <p className="pinyin-section-subtitle">
          Click a final to select it, then combine with an initial
        </p>
        <FinalsGrid finals={data.finals} selected={selectedFinal} onSelect={handleFinalSelect} />
      </section>

      <section className="pinyin-section">
        {combination ? (
          <CombinationDisplay
            initial={selectedInitial!}
            final={selectedFinal!}
            tones={combination.tones}
            onPlayTone={handlePlayTone}
            loadingPinyin={loadingPinyin}
          />
        ) : selectedInitial && selectedFinal ? (
          <div className="pinyin-combination-empty">
            <p>
              No valid combination for{" "}
              <strong>
                {selectedInitial}+{selectedFinal}
              </strong>
            </p>
          </div>
        ) : (
          <div className="pinyin-combination-hint">
            <p>Select an initial and a final to see tone combinations</p>
          </div>
        )}
      </section>
    </div>
  );
}
