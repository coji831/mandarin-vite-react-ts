/**
 * @file components/ChengyuCard.tsx
 * @description Chengyu idiom preview card — idiom, pinyin, figurative meaning,
 * era/theme badges, and example count/preview sentence.
 * Story 23.3: Chengyu UI
 *
 * Follows preview-detail-separation: the card is a TEASER (figurative meaning +
 * preview example) — the narrative story, literal meaning, and full examples
 * live only in the detail hub, so the learner is rewarded for clicking.
 *
 * Always clickable. Card click is delegated to the page →
 * `openHub({ entityType: "chengyu", ... })`.
 */
import type { KeyboardEvent } from "react";
import { Badge, Box } from "shared/components";
import type { ChengyuData } from "../types";
import "./ChengyuCard.css";

export interface ChengyuCardProps {
  idiom: ChengyuData;
  onClick: () => void;
}

export function ChengyuCard({ idiom, onClick }: ChengyuCardProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // Keyboard single-activation (Enter/Space) for the div[role=button] card.
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <Box
      variant="card"
      padding="md"
      className="chengyu-card flex-col gap-sm"
      role="button"
      tabIndex={0}
      aria-label={`${idiom.chengyu} — ${idiom.pinyin} — ${idiom.figurativeMeaning}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      <div className="chengyu-card__header">
        <h3 className="chengyu-card__chengyu font-lg fw-700 text-secondary m-0">{idiom.chengyu}</h3>
        <span className="chengyu-card__count font-xs text-muted shrink-0">
          {idiom.exampleCount} {idiom.exampleCount === 1 ? "example" : "examples"}
        </span>
      </div>

      <p className="chengyu-card__pinyin font-sm text-primary-light font-italic m-0">
        {idiom.pinyin}
      </p>

      <p className="chengyu-card__meaning font-sm text-tertiary m-0">{idiom.figurativeMeaning}</p>

      {idiom.previewExample && (
        <p className="chengyu-card__preview font-sm text-primary-light font-italic m-0">
          {idiom.previewExample}
        </p>
      )}

      <div className="chengyu-card__meta flex flex-wrap gap-xs">
        <Badge variant="primary">{idiom.theme}</Badge>
        <Badge variant="surface">{idiom.era}</Badge>
      </div>
    </Box>
  );
}
