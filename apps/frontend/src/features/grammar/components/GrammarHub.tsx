/**
 * @file components/GrammarHub.tsx
 * @description Grammar pattern detail hub — rendered inside the shared LexicalHub
 * dialog (registered via `entityHubRegistry`). Always self-fetches via
 * `useGrammarDetail(entityId)`.
 *
 * Shows structure, explanation, and examples (Chinese / pinyin / English).
 * - Example sentences play via `useAudioItemPlayback().play(chinese, { textIsChinese: true })`
 *   → shared AudioManager → POST /v1/tts (optionalAuth) — no stored audio fields.
 * - Example segment tokens with `entityId`/`entityType` open the Character/Word
 *   hub through `openHub` from `shared/hub-entry` (never `useHubStore` directly);
 *   non-linked tokens render as plain text.
 * - Related patterns open the Grammar hub for that pattern (cross-entity stack).
 * Story 22.3: Grammar UI
 */
import { Badge, Box, Button, ErrorScreen, Icon, Skeleton } from "shared/components";
import { openHub } from "shared/hub-entry";
import { useAudioItemPlayback } from "shared/hooks";
import { useGrammarDetail } from "../hooks";
import { segmentToEntityRef } from "../utils";
import type { GrammarExample, GrammarSegment } from "../types";
import "./GrammarHub.css";

export interface GrammarHubProps {
  /** Pattern content_id ("gr_XXXX"). */
  entityId: string;
}

function ExampleBlock({
  example,
  audioLoading,
  onPlay,
  onSegmentClick,
}: {
  example: GrammarExample;
  audioLoading: boolean;
  onPlay: () => void;
  onSegmentClick: (segment: GrammarSegment) => void;
}) {
  return (
    <div className="grammar-hub__example flex-col gap-xs p-sm radius-md border-1 border-surface bg-surface-dark">
      <div className="grammar-hub__example-head flex-between gap-sm">
        <p className="grammar-hub__example-chinese font-lg text-primary fw-600 m-0">
          {example.chinese}
        </p>
        <Button
          variant="circle"
          size="sm"
          className="grammar-hub__play-btn shrink-0"
          disabled={audioLoading}
          aria-label={`Play example audio: ${example.chinese}`}
          onClick={onPlay}
        >
          {audioLoading ? "…" : <Icon name="audio" size={16} aria-hidden />}
        </Button>
      </div>
      <p className="grammar-hub__example-pinyin font-sm text-primary-light font-italic m-0">
        {example.pinyin}
      </p>
      <p className="grammar-hub__example-english font-sm text-tertiary m-0">{example.english}</p>

      {/* Word/character cross-linking — linked tokens open the hub, others are plain text */}
      {example.segments.length > 0 && (
        <div
          className="grammar-hub__segments flex flex-wrap gap-xs mt-xs"
          aria-label="Sentence tokens"
        >
          {example.segments.map((segment, idx) => {
            const ref = segmentToEntityRef(segment);
            const title = `${segment.text} — ${segment.pinyin} — ${segment.gloss}`;
            return ref ? (
              <button
                key={`${idx}-${segment.text}`}
                type="button"
                className="grammar-hub__segment-token btn-base font-sm"
                title={title}
                aria-label={title}
                onClick={() => onSegmentClick(segment)}
              >
                {segment.text}
              </button>
            ) : (
              <span
                key={`${idx}-${segment.text}`}
                className="grammar-hub__segment-text font-sm"
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

export function GrammarHub({ entityId }: GrammarHubProps) {
  const { pattern, isLoading, isError, refetch } = useGrammarDetail(entityId);
  const { play, isLoading: audioLoading } = useAudioItemPlayback();

  // ─── Error state ───────────────────────────────────────────────────────
  if (isError) {
    return (
      <ErrorScreen
        error="Failed to load grammar pattern details. Please try again."
        onRetry={refetch}
        title="Unable to load grammar pattern"
      />
    );
  }

  // ─── Loading state (skeleton) ──────────────────────────────────────────
  if (isLoading) {
    return (
      <div
        className="grammar-hub flex-col gap-md p-md"
        role="status"
        aria-label="Loading grammar pattern"
      >
        <div className="flex-col gap-xs">
          <Skeleton variant="line" width="70%" height="20px" />
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
  if (!pattern) {
    return (
      <Box variant="card" padding="md" className="flex-center">
        <p className="font-sm text-tertiary m-0">No grammar pattern data available.</p>
      </Box>
    );
  }

  const handleSegmentClick = (segment: GrammarSegment) => {
    const ref = segmentToEntityRef(segment);
    if (ref) openHub(ref);
  };

  return (
    <Box variant="card" padding="md" className="grammar-hub w-full flex-col gap-md animate-fade-in">
      {/* Header — name + badges */}
      <div className="grammar-hub__header flex-col gap-xs">
        <h2 className="grammar-hub__title font-lg fw-700 text-primary m-0">{pattern.name}</h2>
        <div className="grammar-hub__badges flex flex-wrap gap-xs">
          {pattern.hskLevel !== null && pattern.hskLevel !== undefined && (
            <Badge variant="primary">HSK {pattern.hskLevel}</Badge>
          )}
          <Badge variant="surface">Phase {pattern.phase}</Badge>
        </div>
      </div>

      <Box variant="divider" />

      {/* Structure */}
      <div className="grammar-hub__section flex-col gap-xs">
        <h3 className="grammar-hub__section-title font-sm fw-600 text-secondary m-0">Structure</h3>
        <p className="grammar-hub__structure font-md text-primary m-0">{pattern.structure}</p>
      </div>

      {/* Explanation */}
      <div className="grammar-hub__section flex-col gap-xs">
        <h3 className="grammar-hub__section-title font-sm fw-600 text-secondary m-0">
          Explanation
        </h3>
        <p className="grammar-hub__explanation font-sm text-secondary lh-normal m-0">
          {pattern.explanation}
        </p>
      </div>

      {/* Examples */}
      <div className="grammar-hub__section flex-col gap-sm">
        <h3 className="grammar-hub__section-title font-sm fw-600 text-secondary m-0">Examples</h3>
        {pattern.examples.map((example) => (
          <ExampleBlock
            key={example.id}
            example={example}
            audioLoading={audioLoading}
            onPlay={() => play(example.chinese, { textIsChinese: true })}
            onSegmentClick={handleSegmentClick}
          />
        ))}
      </div>

      {/* Related patterns */}
      {pattern.relatedPatterns.length > 0 && (
        <div className="grammar-hub__section flex-col gap-xs">
          <h3 className="grammar-hub__section-title font-sm fw-600 text-secondary m-0">
            Related Patterns
          </h3>
          <div className="grammar-hub__related flex flex-wrap gap-xs">
            {pattern.relatedPatterns.map((related) => (
              <button
                key={related.id}
                type="button"
                className="grammar-hub__related-link btn-base font-sm text-accent"
                onClick={() =>
                  openHub({ entityType: "grammar", entityId: related.id, label: related.name })
                }
              >
                {related.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </Box>
  );
}
