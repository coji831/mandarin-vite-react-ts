/**
 * @file HubIdentityCard.tsx
 * @description Character Detail Hub — NORTH zone: Character Identity Card
 *
 * Replaces the old empty NORTH box and HubInfoLine.
 * Shows character glyph, pinyin + meaning, metadata badges, and etymology.
 * Fetches its own data via useCharacterDetail hook — independent loading.
 * Falls back gracefully when detail data is not yet available.
 * Accepts optional props for Storybook/development.
 */

import { Badge, Skeleton } from "shared/components";
import { useCharacterDetail } from "../../hooks";
import { getToneClass, extractTone } from "../../utils/toneUtils";
import "./HubIdentityCard.css";

export type HubIdentityCardProps = {
  character: string;
  pinyin?: string | null;
  /** Optional props for Storybook — overrides self-fetched data */
  meaning?: string;
  hskLevel?: number;
  strokeCount?: number;
  traditional?: string;
  frequencyRank?: number;
  etymology?: string;
  loading?: boolean;
};

export function HubIdentityCard({
  character,
  pinyin,
  meaning: propMeaning,
  hskLevel: propHskLevel,
  strokeCount: propStrokeCount,
  traditional: propTraditional,
  frequencyRank: propFreqRank,
  etymology: propEtymology,
  loading: propLoading,
}: HubIdentityCardProps) {
  const { data, loading: hookLoading } = useCharacterDetail(character);

  // Use props if provided (Storybook), otherwise self-fetched data
  const loading = propLoading ?? hookLoading;
  const meaning = propMeaning ?? data?.definition ?? data?.readings?.[0]?.core_meaning;
  const hskLevel = propHskLevel ?? data?.hskLevel;
  const strokeCount = propStrokeCount ?? data?.strokeCount;
  const traditional =
    propTraditional ?? (data?.traditional !== character ? data?.traditional : undefined);
  const frequencyRank = propFreqRank ?? data?.frequencyRank;
  const etymology = propEtymology ?? data?.etymology;

  if (loading) {
    return (
      <div
        className="hub-identity flex-col gap-sm"
        role="status"
        aria-label="Loading character info"
      >
        <div className="hub-identity__header flex items-center gap-md">
          <Skeleton
            variant="custom"
            className="hub-identity__glyph-skeleton radius-md"
            aria-hidden="true"
          />
          <div className="flex-col gap-xs">
            <Skeleton variant="line" height="18px" width="120px" />
            <Skeleton variant="line" height="14px" width="200px" />
          </div>
        </div>
        <div className="flex gap-xs">
          <Skeleton
            variant="custom"
            className="hub-identity__badge-skeleton radius-pill"
            aria-hidden="true"
          />
          <Skeleton
            variant="custom"
            className="hub-identity__badge-skeleton radius-pill"
            aria-hidden="true"
          />
        </div>
      </div>
    );
  }

  const tone = pinyin ? extractTone(pinyin) : undefined;
  const toneClass = getToneClass(tone);

  const badges: string[] = [];
  if (hskLevel) badges.push(`HSK ${hskLevel}`);
  if (strokeCount) badges.push(`${strokeCount} strokes`);
  if (traditional) badges.push(`传统: ${traditional}`);
  if (frequencyRank) badges.push(`#${frequencyRank}`);

  return (
    <div className="hub-identity flex-col gap-xs">
      {/* Top row: glyph + pinyin/meaning (left) | badges (right) */}
      <div className="flex items-center justify-between gap-sm">
        <div className="hub-identity__header flex items-center gap-md">
          <span className="hub-identity__glyph font-4xl fw-600 lh-tight text-primary shrink-0">
            {character}
          </span>
          <div className="flex-col gap-xs">
            {pinyin && (
              <span className={`hub-identity__pinyin font-md fw-500 ${toneClass}`}>{pinyin}</span>
            )}
            {meaning && (
              <span className="hub-identity__meaning font-sm text-primary">{meaning}</span>
            )}
          </div>
        </div>
        {badges.length > 0 && (
          <div className="hub-identity__badges flex gap-xs flex-wrap">
            {badges.map((badge) => (
              <Badge key={badge} variant="surface">
                {badge}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Etymology */}
      {etymology && (
        <p className="hub-identity__etymology text-tertiary font-xs m-0">{etymology}</p>
      )}
    </div>
  );
}
