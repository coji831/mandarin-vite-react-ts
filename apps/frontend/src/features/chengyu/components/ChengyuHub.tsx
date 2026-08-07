/**
 * @file components/ChengyuHub.tsx
 * @description Chengyu idiom detail panel — narrative-first: story → literal
 * meaning → figurative meaning → modern-usage examples, with per-idiom + per-
 * example audio, clickable idiom characters (→ Character Hub), segmented
 * example tokens (→ Character/Word hub), and related-idiom cross-links.
 * Story 23.3: Chengyu UI
 *
 * All hub navigation goes through `openHub()` from `shared/hub-entry` — never
 * direct `useHubStore` calls. Audio uses the shared manager via
 * `useAudioItemPlayback().play(chinese, { textIsChinese: true })` → POST /v1/tts.
 */
import { Badge, Box, Button, ErrorScreen, Skeleton } from "shared/components";
import { openHub } from "shared/hub-entry";
import { useAudioItemPlayback } from "shared/hooks";
import { useChengyuDetail } from "../hooks";
import { segmentToEntityRef } from "../utils";
import type { ChengyuExample, ChengyuSegment } from "../types";
import "./ChengyuHub.css";

export interface ChengyuHubProps {
  /** Idiom content_id (e.g. "cy_0001"). */
  entityId: string;
}

function ExampleBlock({
  example,
  audioLoading,
  onPlay,
  onSegmentClick,
}: {
  example: ChengyuExample;
  audioLoading: boolean;
  onPlay: () => void;
  onSegmentClick: (segment: ChengyuSegment) => void;
}) {
  return (
    <div className="chengyu-hub__example flex-col gap-xs p-sm radius-md border-1 border-surface bg-surface-dark">
      <div className="chengyu-hub__example-head flex-between gap-sm">
        <p className="chengyu-hub__example-chinese font-lg text-primary fw-600 m-0">
          {example.chinese}
        </p>
        <Button
          variant="circle"
          size="sm"
          className="chengyu-hub__play-btn shrink-0"
          disabled={audioLoading}
          aria-label={`Play example audio: ${example.chinese}`}
          onClick={onPlay}
        >
          {audioLoading ? "…" : "🔊"}
        </Button>
      </div>
      <p className="chengyu-hub__example-pinyin font-sm text-primary-light font-italic m-0">
        {example.pinyin}
      </p>
      <p className="chengyu-hub__example-english font-sm text-tertiary m-0">{example.english}</p>

      {/* Character/word cross-linking — linked tokens open the hub, others are plain text */}
      {example.segments.length > 0 && (
        <div
          className="chengyu-hub__segments flex flex-wrap gap-xs mt-xs"
          aria-label="Sentence tokens"
        >
          {example.segments.map((segment, idx) => {
            const ref = segmentToEntityRef(segment);
            const title = `${segment.text} — ${segment.pinyin} — ${segment.gloss}`;
            return ref ? (
              <button
                key={`${idx}-${segment.text}`}
                type="button"
                className="chengyu-hub__segment-token btn-base font-sm"
                title={title}
                aria-label={title}
                onClick={() => onSegmentClick(segment)}
              >
                {segment.text}
              </button>
            ) : (
              <span
                key={`${idx}-${segment.text}`}
                className="chengyu-hub__segment-text font-sm"
                title={title}
              >
                {segment.text}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ChengyuHub({ entityId }: ChengyuHubProps) {
  const { idiom, isLoading, isError, refetch } = useChengyuDetail(entityId);
  const { play, isLoading: audioLoading } = useAudioItemPlayback();

  // ─── Error state ───────────────────────────────────────────────────────
  if (isError) {
    return (
      <ErrorScreen
        error="Failed to load chengyu idiom details. Please try again."
        onRetry={refetch}
        title="Unable to load idiom"
      />
    );
  }

  // ─── Loading state (skeleton) ──────────────────────────────────────────
  if (isLoading) {
    return (
      <div
        className="chengyu-hub flex-col gap-md p-md"
        role="status"
        aria-label="Loading chengyu idiom"
      >
        <div className="flex-col gap-xs">
          <Skeleton variant="line" width="50%" height="28px" />
          <div className="flex gap-xs">
            <Skeleton variant="custom" width="64px" height="24px" className="radius-pill" />
            <Skeleton variant="custom" width="72px" height="24px" className="radius-pill" />
          </div>
        </div>
        <Skeleton variant="line" width="90%" height="16px" />
        <Skeleton variant="line" width="100%" height="14px" />
        <Skeleton variant="line" width="80%" height="14px" />
        <div className="flex-col gap-sm">
          <Skeleton variant="line" width="120px" height="16px" />
          <Skeleton variant="custom" width="100%" height="96px" className="radius-md" />
        </div>
      </div>
    );
  }

  // ─── No data fallback ──────────────────────────────────────────────────
  if (!idiom) {
    return (
      <Box variant="card" padding="md" className="flex-center">
        <p className="font-sm text-tertiary m-0">No idiom data available.</p>
      </Box>
    );
  }

  const handleSegmentClick = (segment: ChengyuSegment) => {
    const ref = segmentToEntityRef(segment);
    if (ref) openHub(ref);
  };

  const handleCharClick = (char: string) => {
    openHub({ entityType: "character", entityId: char, label: char });
  };

  return (
    <Box variant="card" padding="md" className="chengyu-hub w-full flex-col gap-md animate-fade-in">
      {/* Header — idiom + pinyin + badges + audio + clickable characters */}
      <div className="chengyu-hub__header flex-col gap-xs">
        <div className="chengyu-hub__title-row flex-between gap-sm">
          <h2 className="chengyu-hub__title font-xl fw-700 text-primary m-0">{idiom.chengyu}</h2>
          <Button
            variant="circle"
            size="sm"
            className="chengyu-hub__play-btn shrink-0"
            disabled={audioLoading}
            aria-label={`Play idiom audio: ${idiom.chengyu}`}
            onClick={() => play(idiom.chengyu, { textIsChinese: true })}
          >
            {audioLoading ? "…" : "🔊"}
          </Button>
        </div>
        <p className="chengyu-hub__pinyin font-md text-primary-light font-italic m-0">
          {idiom.pinyin}
        </p>

        {/* The idiom's characters are clickable → Character Hub */}
        <div className="chengyu-hub__chars flex gap-xs" aria-label="Idiom characters">
          {Array.from(idiom.chengyu).map((char, idx) => (
            <button
              key={`${idx}-${char}`}
              type="button"
              className="chengyu-hub__char"
              aria-label={`Open character hub: ${char}`}
              onClick={() => handleCharClick(char)}
            >
              {char}
            </button>
          ))}
        </div>

        <div className="chengyu-hub__badges flex flex-wrap gap-xs">
          <Badge variant="primary">{idiom.theme}</Badge>
          <Badge variant="surface">{idiom.era}</Badge>
        </div>
      </div>

      <Box variant="divider" />

      {/* Narrative story */}
      <div className="chengyu-hub__section flex-col gap-xs">
        <h3 className="chengyu-hub__section-title font-sm fw-600 text-secondary m-0">Story</h3>
        <p className="chengyu-hub__story font-sm text-secondary lh-normal m-0">{idiom.story}</p>
        <p className="chengyu-hub__source font-xs text-muted m-0">{idiom.storySource}</p>
      </div>

      {/* Literal meaning */}
      <div className="chengyu-hub__section flex-col gap-xs">
        <h3 className="chengyu-hub__section-title font-sm fw-600 text-secondary m-0">
          Literal meaning
        </h3>
        <p className="chengyu-hub__literal font-sm text-secondary lh-normal m-0">
          {idiom.literalMeaning}
        </p>
      </div>

      {/* Figurative meaning */}
      <div className="chengyu-hub__section flex-col gap-xs">
        <h3 className="chengyu-hub__section-title font-sm fw-600 text-secondary m-0">
          Figurative meaning
        </h3>
        <p className="chengyu-hub__figurative font-sm text-primary lh-normal m-0">
          {idiom.figurativeMeaning}
        </p>
      </div>

      {/* Modern-usage examples */}
      <div className="chengyu-hub__section flex-col gap-sm">
        <h3 className="chengyu-hub__section-title font-sm fw-600 text-secondary m-0">
          Modern usage
        </h3>
        {idiom.examples.map((example) => (
          <ExampleBlock
            key={example.id}
            example={example}
            audioLoading={audioLoading}
            onPlay={() => play(example.chinese, { textIsChinese: true })}
            onSegmentClick={handleSegmentClick}
          />
        ))}
      </div>

      {/* Related idioms */}
      {idiom.relatedIdioms.length > 0 && (
        <div className="chengyu-hub__section flex-col gap-xs">
          <h3 className="chengyu-hub__section-title font-sm fw-600 text-secondary m-0">
            Related idioms
          </h3>
          <div className="chengyu-hub__related flex flex-wrap gap-xs">
            {idiom.relatedIdioms.map((related) => (
              <button
                key={related.id}
                type="button"
                className="chengyu-hub__related-link btn-base font-sm text-accent"
                aria-label={`Open related idiom: ${related.chengyu} (${related.relationType})`}
                onClick={() =>
                  openHub({
                    entityType: "chengyu",
                    entityId: related.id,
                    label: related.chengyu,
                  })
                }
              >
                {related.chengyu}
                <span className="chengyu-hub__relation-type font-xs text-muted">
                  {related.relationType}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </Box>
  );
}
