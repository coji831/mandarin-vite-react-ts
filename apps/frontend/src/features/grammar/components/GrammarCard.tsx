/**
 * @file components/GrammarCard.tsx
 * @description Grammar pattern preview card — name, structure, preview example,
 * HSK badge, and phase-lock badge (Phase 3/4 patterns show as locked/preview
 * cards for lower-phase learners — "discovery, not gate").
 * Story 22.3: Grammar UI
 *
 * Always clickable (locked cards still open the detail hub). Card click is
 * delegated to the page → `openHub({ entityType: "grammar", ... })`.
 */
import type { KeyboardEvent } from "react";
import { Badge, Box } from "shared/components";
import type { GrammarPatternData } from "../types";
import "./GrammarCard.css";

export interface GrammarCardProps {
  pattern: GrammarPatternData;
  /** Whether the pattern's phase is above the learner's current phase. */
  isLocked: boolean;
  onClick: () => void;
}

export function GrammarCard({ pattern, isLocked, onClick }: GrammarCardProps) {
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
      className="grammar-card flex-col gap-sm"
      role="button"
      tabIndex={0}
      aria-label={`${pattern.name} — ${pattern.structure}${isLocked ? ` — locked until Phase ${pattern.phase}` : ""}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      <div className="grammar-card__header">
        <h3 className="grammar-card__name font-md fw-600 text-secondary">{pattern.name}</h3>
        {isLocked && (
          <span
            className="grammar-card__lock font-xs text-muted shrink-0"
            aria-label={`Locked until Phase ${pattern.phase}`}
          >
            🔒 Phase {pattern.phase}
          </span>
        )}
      </div>

      <p className="grammar-card__structure font-sm text-tertiary">{pattern.structure}</p>

      {pattern.previewExample && (
        <p className="grammar-card__preview font-sm text-primary-light font-italic">
          {pattern.previewExample}
        </p>
      )}

      <div className="grammar-card__meta flex flex-wrap gap-xs">
        {pattern.hskLevel !== null && pattern.hskLevel !== undefined && (
          <Badge variant="primary">HSK {pattern.hskLevel}</Badge>
        )}
      </div>
    </Box>
  );
}
