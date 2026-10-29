/**
 * @file components/blueprint/BlueprintStepBody.tsx
 * @description One Blueprint step on screen — the body switch (rework-proposal §3).
 *
 * Reuses the EXISTING reference components rather than re-implementing them:
 * `PinyinCell` (initials/finals), `ToneContourCard`, `TonePairDrills`,
 * `StrokeReferenceContent`. Only the radicals and characters steps are new, and
 * both are built from real API data (radical list; the pinyin→Hanzi map, in
 * syllable order, for the first 20 characters).
 */
import { useMemo, useState } from "react";
import { Box, Button, Icon, Skeleton } from "shared/components";
import { openHub } from "shared/hub-entry";
import { applyToneMark, resolveHanzi } from "@mandarin/shared-utils";
import { useAudioItemPlayback, usePinyinCharacterMap } from "shared/hooks";
import { PinyinCell } from "../pinyin/PinyinCell";
import { ToneContourCard } from "../tones/ToneContourCard";
import { TonePairDrills } from "../tones/TonePairDrills";
import { StrokeReferenceContent } from "../strokes/StrokeReferenceContent";
import { useBlueprintContent } from "../../hooks/useBlueprintContent";
import type { BlueprintStepId } from "./blueprintSteps";
import "./BlueprintStepBody.css";

export type BlueprintStepBodyProps = {
  stepId: BlueprintStepId;
};

/** First syllables in curriculum order that resolve to a character. */
function firstCharacters(
  combinations: { tones: (string | null)[] }[],
  charMap: Record<string, string | null> | null,
): { glyph: string; pinyin: string; tone: number }[] {
  if (!charMap) return [];
  const seen = new Set<string>();
  const out: { glyph: string; pinyin: string; tone: number }[] = [];

  for (const combination of combinations) {
    // Tone 1 first, then the rest — a beginner meets the plain high tone first.
    for (const tone of combination.tones) {
      if (!tone) continue;
      const glyph = resolveHanzi(tone, charMap);
      if (!glyph || seen.has(glyph)) continue;
      seen.add(glyph);
      out.push({ glyph, pinyin: tone, tone: Number(tone.slice(-1)) || 0 });
      break;
    }
    if (out.length >= 20) break;
  }
  return out;
}

export function BlueprintStepBody({ stepId }: BlueprintStepBodyProps) {
  const { pool, radicals, isLoading, hasError, retry } = useBlueprintContent();
  const { charMap } = usePinyinCharacterMap();
  const { play } = useAudioItemPlayback();
  const [playing, setPlaying] = useState<string | null>(null);

  const characters = useMemo(
    () => (pool ? firstCharacters(pool.combinations, charMap) : []),
    [pool, charMap],
  );

  if (hasError) {
    return (
      <Box variant="dashed" radius="lg" padding="xl" className="flex-col-center gap-sm">
        <p className="font-sm text-error m-0">Could not load this step.</p>
        <Button variant="secondary" size="sm" onClick={retry}>
          Try again
        </Button>
      </Box>
    );
  }

  if (isLoading || !pool) {
    return (
      <div className="flex-col gap-sm" role="status" aria-label="Loading step">
        <Skeleton variant="line" width="60%" height="20px" />
        <Skeleton variant="card" height="120px" />
      </div>
    );
  }

  /** Play the Hanzi a syllable resolves to — pinyin is never sent to TTS. */
  const playSyllable = (syllable: string) => {
    const audioText = resolveHanzi(syllable, charMap);
    if (!audioText) return;
    setPlaying(syllable);
    play(audioText);
  };

  switch (stepId) {
    case "initials":
      return (
        <div className="flex gap-xs flex-wrap">
          {pool.initials.map((initial) => (
            <PinyinCell
              key={initial.id}
              id={initial.id}
              label={initial.pinyin}
              secondary={initial.ipa}
              isSelected={playing === initial.pinyin}
              ariaLabel={`Hear the initial ${initial.pinyin}: ${initial.description}`}
              onSelect={() => playSyllable(initial.pinyin)}
            />
          ))}
        </div>
      );

    case "finals":
      return (
        <div className="flex gap-xs flex-wrap">
          {pool.finals.map((final) => (
            <PinyinCell
              key={final.id}
              id={final.id}
              label={final.pinyin}
              isSelected={playing === final.pinyin}
              ariaLabel={`Hear the final ${final.pinyin}: ${final.description}`}
              onSelect={() => playSyllable(final.pinyin)}
            />
          ))}
        </div>
      );

    case "tones":
      return (
        <div className="blueprint-step__tones grid grid-2-col gap-sm">
          {pool.toneInfo.map((tone) => (
            <ToneContourCard
              key={tone.number}
              tone={tone}
              onPlay={playSyllable}
              isLoading={playing === tone.pinyinExample}
            />
          ))}
        </div>
      );

    case "tone-pairs":
      return (
        <TonePairDrills drills={pool.tonePairs} onPlay={playSyllable} loadingPinyin={playing} />
      );

    case "stroke-order":
      return <StrokeReferenceContent />;

    case "radicals": {
      // Recommended radicals first — the "first radicals" a character learner
      // meets before any full character (Phase 2 opens Radicals First).
      const firstRadicals = [...radicals]
        .sort((a, b) => Number(b.is_recommended) - Number(a.is_recommended))
        .slice(0, 8);
      return (
        <div className="grid grid-2-col gap-sm">
          {firstRadicals.map((radical) => (
            <Button
              key={radical.id}
              variant="control"
              className="blueprint-step__radical flex-col gap-xs text-left"
              onClick={() =>
                openHub({
                  entityType: "radical",
                  entityId: radical.id,
                  label: `${radical.glyph} (${radical.name_pinyin})`,
                })
              }
            >
              <span className="font-3xl lh-1 text-primary">{radical.glyph}</span>
              <span className="font-sm fw-600 text-secondary">{radical.meaning}</span>
              <span className="font-xs text-tertiary">
                {radical.name_pinyin} · {radical.stroke_count} strokes
              </span>
            </Button>
          ))}
        </div>
      );
    }

    case "characters":
      return (
        <div className="grid grid-3-col gap-sm">
          {characters.map((character) => (
            <Button
              key={character.glyph}
              variant="control"
              className="blueprint-step__character flex-col justify-center gap-xs"
              onClick={() => playSyllable(character.pinyin)}
              aria-label={`Hear ${character.glyph}`}
            >
              <span className="font-3xl lh-1 text-primary">{character.glyph}</span>
              <span className="font-xs text-tertiary">
                {applyToneMark(character.pinyin.replace(/[1-5]$/, ""), character.tone)}
              </span>
            </Button>
          ))}
          {characters.length === 0 && (
            <p className="font-sm text-tertiary m-0 flex items-center gap-xs">
              <Icon name="audio" size={16} aria-hidden /> Character audio is unavailable right now —
              the syllables above are still worth one pass.
            </p>
          )}
        </div>
      );
  }
}
