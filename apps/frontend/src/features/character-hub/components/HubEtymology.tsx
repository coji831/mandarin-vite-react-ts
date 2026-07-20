/**
 * @file HubEtymology.tsx
 * @description Character Detail Hub — North zone: etymology + character info
 *
 * Shows etymology description, traditional form (if different), HSK level, stroke count.
 * Supports loading skeleton state.
 */

import { Skeleton } from "shared/components";

export type HubEtymologyProps = {
  etymology?: string;
  traditional?: string;
  hskLevel?: number;
  strokeCount?: number;
  loading?: boolean;
};

export function HubEtymology({
  etymology,
  traditional,
  hskLevel,
  strokeCount,
  loading,
}: HubEtymologyProps) {
  if (loading) {
    return (
      <div className="flex-col gap-xs" role="status" aria-label="Loading etymology">
        <Skeleton variant="line" height="16px" />
        <Skeleton variant="line" height="14px" width="60%" />
      </div>
    );
  }

  if (!etymology) return null;

  const infoParts: string[] = [];
  if (traditional) infoParts.push(`传统: ${traditional}`);
  if (hskLevel) infoParts.push(`HSK ${hskLevel}`);
  if (strokeCount) infoParts.push(`${strokeCount} strokes`);

  return (
    <div className="flex-col gap-xs">
      <p className="font-sm text-tertiary m-0">{etymology}</p>
      {infoParts.length > 0 && <p className="font-xs text-muted m-0">{infoParts.join("  ·  ")}</p>}
    </div>
  );
}
