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
import { ErrorScreen, LoadingScreen, Box } from "shared/components";
import {
  ToneContourCard,
  TonePairDrills,
  ToneChangeRules,
  SandhiDrill,
  foundationsService,
  TONE_LABELS,
  TONE_SYMBOLS,
} from "features/foundations";
import type { PinyinTonesPool } from "features/foundations";

import "./TonesTab.css";

const TONE_BOX_VARIANTS = ["tone-1", "tone-2", "tone-3", "tone-4", "tone-5"] as const;

export function TonesTab() {
  const [data, setData] = useState<PinyinTonesPool | null>(null);
  const [loadingPinyin, setLoadingPinyin] = useState<string | null>(null);
  const [charMap, setCharMap] = useState<Record<string, string>>({});
  const [hasError, setHasError] = useState(false);
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
      } catch {
        // Failed to load tones data — error state shown
        fetchAttempted.current = false; // Allow retry
        setHasError(true);
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
    } catch {
      // Audio playback failed — non-critical, TTS fallback available
    } finally {
      setLoadingPinyin(null);
    }
  };

  if (hasError) {
    return (
      <ErrorScreen
        error="Failed to load tones data"
        onRetry={() => {
          fetchAttempted.current = false;
          setHasError(false);
          setData(null);
        }}
      />
    );
  }

  if (!data) {
    return <LoadingScreen message="Loading tones data..." />;
  }

  return (
    <div className="tones-tab flex-col gap-sm mx-auto">
      {/* Intro Header — full width */}
      <Box variant="dark" padding="md" className="tones-tab-header flex-col gap-xs">
        <h2 className="font-xl fw-700 text-secondary m-0">Tones Reference &amp; Practice</h2>
        <p className="font-sm text-muted m-0">
          5 tones &middot; {data.tonePairs.length} tone pairs &middot; {data.toneRules.length} tone
          change rules
        </p>
        <p className="font-sm text-muted m-0">Click the play button to hear each tone pronounced</p>
      </Box>

      {/* Tone Color Legend — full width */}
      <div className="tones-tab-legend flex items-center flex-wrap gap-xs">
        {[1, 2, 3, 4, 0].map((toneNum) => {
          const toneCss = toneNum === 0 ? 5 : toneNum;
          return (
            <Box
              key={toneNum}
              variant={TONE_BOX_VARIANTS[toneCss - 1]}
              className="tones-tab-legend-chip inline-flex items-center radius-pill bg-surface-dark lh-1 gap-4px"
              title={TONE_LABELS[toneNum]}
            >
              <span className="font-sm fw-600">{TONE_SYMBOLS[toneNum]}</span>
              <span className="font-xs">{TONE_LABELS[toneNum]}</span>
            </Box>
          );
        })}
      </div>

      {/* Tone Reference Section */}
      <section className="flex-col">
        <h3 className="tones-section-heading font-sm text-secondary fw-600 m-0">Tone Contours</h3>
        <p className="tones-section-subtitle font-xs text-muted">
          Click the play button to hear each tone pronounced
        </p>
        <Box variant="dark-alt" padding="xs" className="tones-contour-grid">
          {data.toneInfo.map((tone) => (
            <ToneContourCard
              key={tone.number}
              tone={tone}
              onPlay={handlePlay}
              isLoading={loadingPinyin === tone.pinyinExample}
            />
          ))}
        </Box>
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

      {/* Tone Sandhi Drill Section */}
      <section className="flex-col">
        <h3 className="tones-section-heading font-sm text-secondary fw-600 m-0">
          Tone Sandhi Practice Drill
        </h3>
        <p className="tones-section-subtitle font-xs text-muted">
          Test your knowledge of tone sandhi rules with an interactive quiz
        </p>
        <SandhiDrill />
      </section>

      {/* Pronunciation Tip Callout — full width */}
      <Box variant="dark" padding="md" className="tones-tab-tip">
        <div className="flex-center gap-xs tones-tab-tip-header">
          <span className="font-lg">💡</span>
          <span className="font-sm fw-600 text-secondary">Tip:</span>
        </div>
        <p className="font-sm text-tertiary mt-xs">
          Tones are meaning-distinguishing — mā (妈/mother), má (麻/hemp), mǎ (马/horse), and mà
          (骂/scold) are completely different words despite sharing the same consonant and vowel.
        </p>
      </Box>
    </div>
  );
}
