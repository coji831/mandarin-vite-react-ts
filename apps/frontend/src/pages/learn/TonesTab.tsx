/**
 * @file TonesTab.tsx
 * @description Tones reference and practice tab with contour visualization,
 *              tone pair drills, and tone change rules
 * Story 18.3: Tones Reference & Practice
 *
 * Mounted inside FoundationsPage.tsx when activeTab === "tones".
 * Loads tones.json data on mount and caches it in a module-level variable.
 * Uses useAudioPlayback for TTS audio on tone cards, pair drills, and rule examples.
 */

import { useEffect, useRef, useState } from "react";

import { useAudioPlayback } from "shared/hooks";
import {
  ToneContourCard,
  TonePairDrills,
  ToneChangeRules,
  foundationsService,
} from "features/foundations";
import type { PinyinTonesPool } from "features/foundations";

import "./TonesTab.css";

export function TonesTab() {
  const [data, setData] = useState<PinyinTonesPool | null>(null);
  const [loadingPinyin, setLoadingPinyin] = useState<string | null>(null);
  const [charMap, setCharMap] = useState<Record<string, string>>({});
  const { playWordAudio } = useAudioPlayback();
  const fetchAttempted = useRef(false);

  // Fetch tones.json data on mount (once) — cache lives in foundationsService
  useEffect(() => {
    if (fetchAttempted.current) return;
    fetchAttempted.current = true;

    const loadData = async () => {
      try {
        const pool = await foundationsService.getPinyinTonesPool();
        setData(pool);
      } catch (err) {
        console.error("[TonesTab] Failed to load tones data:", err);
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

  // Handle playing audio for a pinyin syllable or Chinese word
  const handlePlay = async (text: string) => {
    setLoadingPinyin(text);
    try {
      // For pinyin syllables, map to Chinese character for better TTS;
      // for Chinese words (multiple characters), use directly
      const audioText = /^[a-zāáǎàōóǒòēéěèīíǐìūúǔùǖǘǚǜ]/.test(text) ? charMap[text] || text : text;
      await playWordAudio({ chinese: audioText, fallbackToBrowserTTS: true });
    } catch (err) {
      console.warn(`[TonesTab] Audio failed for "${text}"`, err);
    } finally {
      setLoadingPinyin(null);
    }
  };

  if (!data) {
    return (
      <div className="tones-tab tones-tab-loading font-lg flex-center text-muted">
        <p>Loading tones data...</p>
      </div>
    );
  }

  return (
    <div className="tones-tab">
      {/* Tone Reference Section */}
      <section className="flex-col">
        <h3 className="tones-section-heading font-sm text-secondary fw-600 m-0">Tone Contours</h3>
        <p className="tones-section-subtitle font-xs text-muted">
          Click the play button to hear each tone pronounced
        </p>
        <div className="tones-contour-grid bg-surface-dark-alt border-default radius-md p-xs">
          {data.toneInfo.map((tone) => (
            <ToneContourCard
              key={tone.number}
              tone={tone}
              onPlay={handlePlay}
              isLoading={loadingPinyin === tone.pinyinExample}
            />
          ))}
        </div>
      </section>

      {/* Tone Pair Drills Section */}
      <section className="flex-col">
        <h3 className="tones-section-heading font-sm text-secondary fw-600 m-0">
          Tone Pair Drills
        </h3>
        <p className="tones-section-subtitle font-xs text-muted">
          Practice common 2-syllable combinations — sandhi rules applied in spoken form
        </p>
        <TonePairDrills drills={data.tonePairs} onPlay={handlePlay} loadingPinyin={loadingPinyin} />
      </section>

      {/* Tone Change Rules Section */}
      <section className="flex-col">
        <h3 className="tones-section-heading font-sm text-secondary fw-600 m-0">
          Tone Change Rules
        </h3>
        <p className="tones-section-subtitle font-xs text-muted">
          Learn how tones shift in context: 3rd tone sandhi, 一 (yī), and 不 (bù)
        </p>
        <ToneChangeRules rules={data.toneRules} onPlay={handlePlay} loadingPinyin={loadingPinyin} />
      </section>
    </div>
  );
}
