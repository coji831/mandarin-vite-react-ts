/**
 * @file components/ClusterCard.tsx
 * @description Individual phonetic cluster card showing pattern, description, HSK badges, and character chips
 * Story 21.6: Phonetic Clusters
 * VisFix W6a: Cards are now collapsible — collapsed by default showing the family
 * glyph + pinyin + description + member-count chip; expanding reveals the member
 * character chips. HSK badges and the pronunciation note stay visible in both states.
 */

import React, { useState, useCallback } from "react";
import { Badge, Chip, Icon } from "shared/components";
import { openHub } from "shared/store";
import type { PhoneticClusterDetail } from "../types";
import "./ClusterCard.css";

interface ClusterCardProps {
  cluster: PhoneticClusterDetail;
}

export const ClusterCard = React.memo(function ClusterCard({ cluster }: ClusterCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  // Keyboard-operable toggle (Enter / Space) — consistent with the collapsible
  // tree pattern used by PhoneticFamilyNode.
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleExpanded();
      }
    },
    [toggleExpanded],
  );

  const arrowClass = ["cluster-card__arrow", "font-xs", "text-muted", "shrink-0"]
    .filter(Boolean)
    .join(" ");

  return (
    <article className="cluster-card flex-col p-md radius-md border-1 border-surface bg-surface-dark">
      {/* Collapsible header — collapsed by default */}
      <div
        className="cluster-card__toggle flex items-center gap-md cursor-pointer radius-md"
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label={`${cluster.phoneticPattern} (${cluster.pinyin}) — ${cluster.description} — ${cluster.memberCount} members`}
        onClick={toggleExpanded}
        onKeyDown={handleKeyDown}
      >
        {/* Expand/collapse arrow — static glyph swap (▸ collapsed / ▾ expanded), no rotation/transition */}
        <span className={arrowClass} aria-hidden="true">
          {isExpanded ? "▾" : "▸"}
        </span>

        {/* Phonetic Pattern — large glyph + pinyin */}
        <span className="cluster-card__glyph font-5xl text-primary lh-1 shrink-0">
          {cluster.phoneticPattern}
        </span>
        <div className="flex-col gap-xs flex-1">
          <span className="cluster-card__pinyin font-lg text-primary-light font-italic">
            {cluster.pinyin}
          </span>
          <span className="cluster-card__description text-secondary font-sm">
            {cluster.description}
          </span>
        </div>

        {/* Member-count chip — non-interactive shared Chip (count slot) */}
        <Chip
          interactive={false}
          variant="surface"
          size="sm"
          count={`${cluster.memberCount} member${cluster.memberCount !== 1 ? "s" : ""}`}
          className="shrink-0"
        />
      </div>

      {/* Pronunciation Note (if present) — visible in both states */}
      {cluster.pronunciationNote && (
        <div className="cluster-card__pronunciation-note flex items-center gap-sm p-sm radius-sm bg-primary-bg-light mb-md">
          <span className="text-accent" aria-label="Pronunciation note">
            <Icon name="audio" size={16} aria-hidden />
          </span>
          <span className="font-sm text-tertiary font-italic">{cluster.pronunciationNote}</span>
        </div>
      )}

      {/* HSK Level Badges — visible in both states */}
      {cluster.hskLevels.length > 0 && (
        <div className="cluster-card__meta flex items-center gap-sm flex-wrap mb-md">
          {cluster.hskLevels.map((level) => (
            <Badge key={level} variant="accent">
              HSK {level}
            </Badge>
          ))}
        </div>
      )}

      {/* Character Chips Grid — only when expanded (shared Chip, opens hub) */}
      {isExpanded && (
        <div className="cluster-card__members flex flex-wrap gap-sm">
          {cluster.members.map((member) => (
            <Chip
              key={member.glyph}
              interactive
              variant="surface"
              size="md"
              onClick={() =>
                openHub({ entityType: "character", entityId: member.glyph, label: member.pinyin })
              }
              ariaLabel={`${member.glyph} — ${member.pinyin} — ${member.meaning}`}
              title={`${member.glyph} (${member.pinyin}) — ${member.meaning}`}
              className="h-auto py-xs radius-md flex-col items-center bg-surface-light-5"
            >
              <span className="font-xl text-primary lh-1">{member.glyph}</span>
              <span className="font-xs text-primary-light font-italic lh-1">{member.pinyin}</span>
            </Chip>
          ))}
        </div>
      )}
    </article>
  );
});
