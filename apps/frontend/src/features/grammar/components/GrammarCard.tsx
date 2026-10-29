/**
 * @file components/GrammarCard.tsx
 * @description Grammar pattern preview card — name, structure, preview example,
 * HSK badge, and phase badge. Phase is SEQUENCING metadata only, never a lock
 * (BM-1 §3 / rework-proposal §9: a lock that clicks through teaches the learner
 * to distrust the chrome), so the row renders a plain `Badge` in its meta row.
 * Story 22.3: Grammar UI
 *
 * Card click is delegated to the page → `openHub({ entityType: "grammar", ... })`.
 */
import type { KeyboardEvent } from "react";
import { Badge, Box } from "shared/components";
import type { GrammarPatternData } from "../types";
import "./GrammarCard.css";

export interface GrammarCardProps {
  pattern: GrammarPatternData;
  onClick: () => void;
}

export function GrammarCard({ pattern, onClick }: GrammarCardProps) {
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
      aria-label={`${pattern.name} — ${pattern.structure}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      <div className="grammar-card__header">
        <h3 className="grammar-card__name font-md fw-600 text-secondary">{pattern.name}</h3>
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
        <Badge variant="surface">Phase {pattern.phase}</Badge>
      </div>
    </Box>
  );
}
