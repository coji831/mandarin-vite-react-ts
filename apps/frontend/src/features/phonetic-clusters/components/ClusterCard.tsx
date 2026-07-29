/**
 * @file components/ClusterCard.tsx
 * @description Individual phonetic cluster card showing pattern, description, HSK badges, and character chips
 * Story 21.6: Phonetic Clusters
 */

import React from "react";
import { CharacterChip } from "./CharacterChip";
import type { PhoneticClusterDetail } from "../types";
import "./ClusterCard.css";

interface ClusterCardProps {
  cluster: PhoneticClusterDetail;
}

export const ClusterCard = React.memo(function ClusterCard({ cluster }: ClusterCardProps) {
  return (
    <article className="cluster-card flex-col p-md radius-md border-1 border-surface bg-surface-dark">
      {/* Phonetic Pattern — large glyph + pinyin */}
      <div className="cluster-card__header flex items-center gap-md mb-xl">
        <span className="cluster-card__glyph font-5xl text-primary lh-1">
          {cluster.phoneticPattern}
        </span>
        <div className="flex-col gap-xs">
          <span className="cluster-card__pinyin font-lg text-primary-light font-italic">
            {cluster.pinyin}
          </span>
          <span className="cluster-card__description text-secondary font-sm">
            {cluster.description}
          </span>
        </div>
      </div>

      {/* Pronunciation Note (if present) */}
      {cluster.pronunciationNote && (
        <div className="cluster-card__pronunciation-note flex items-center gap-sm p-sm radius-sm bg-primary-bg-light mb-md">
          <span className="font-sm text-accent" aria-label="Pronunciation note">
            🔊
          </span>
          <span className="font-sm text-tertiary font-italic">{cluster.pronunciationNote}</span>
        </div>
      )}

      {/* HSK Level Badges + member count */}
      <div className="cluster-card__meta flex items-center gap-sm flex-wrap mb-md">
        <span className="font-xs text-muted">
          {cluster.memberCount} member{cluster.memberCount !== 1 ? "s" : ""}
        </span>
        <span className="font-xs text-muted" aria-hidden="true">
          ·
        </span>
        {cluster.hskLevels.map((level) => (
          <span
            key={level}
            className="cluster-card__hsk-badge font-xs radius-pill px-xs bg-primary-bg-medium text-accent"
          >
            HSK {level}
          </span>
        ))}
      </div>

      {/* Character Chips Grid */}
      <div className="cluster-card__members flex flex-wrap gap-sm">
        {cluster.members.map((member) => (
          <CharacterChip
            key={member.glyph}
            glyph={member.glyph}
            pinyin={member.pinyin}
            meaning={member.meaning}
          />
        ))}
      </div>
    </article>
  );
});
