/**
 * @file components/PhoneticFamilyNode.tsx
 * @description Expandable phonetic family node — shows phonetic component glyph,
 * pinyin, meaning, character count, and expandable member list with ClassificationBadge
 * Story 21.19: Radical Trees — Phonetic Tree Toggle
 *
 * States:
 * - Collapsed: Shows header only (phonetic glyph, pinyin, meaning, count, expand arrow)
 * - Expanded: Shows header + member list with ClassificationBadge
 * - Empty members: Shows "(no members)" fallback if family has no members
 *
 * Clicking a character opens CharacterHub via openHub.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { Box, Button, ClassificationBadge } from "shared/components";
import { openHub } from "shared/store";
import {
  enrichFamilyMembers,
  type PhoneticFamily,
  type PhoneticFamilyMember,
} from "../services/phoneticTreeService";
import "./PhoneticFamilyNode.css";

interface PhoneticFamilyNodeProps {
  family: PhoneticFamily;
}

export function PhoneticFamilyNode({ family }: PhoneticFamilyNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [enrichedFamily, setEnrichedFamily] = useState<PhoneticFamily | null>(null);
  const enrichmentRef = useRef(false);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleExpanded();
      }
    },
    [toggleExpanded],
  );

  const handleMemberClick = useCallback((member: PhoneticFamilyMember) => {
    openHub({ entityType: "character", entityId: member.glyph, label: member.pinyin });
  }, []);

  // Enrich members with classification data when expanded for the first time
  useEffect(() => {
    if (isExpanded && !enrichmentRef.current) {
      enrichmentRef.current = true;
      enrichFamilyMembers(family)
        .then(setEnrichedFamily)
        .catch(() => {
          // Silently fail — classification badges simply won't show
          setEnrichedFamily(family);
        });
    }
  }, [isExpanded, family]);

  const displayFamily = enrichedFamily ?? family;

  const arrowClass = [
    "phonetic-family-node__arrow",
    "font-xs",
    "text-muted",
    "shrink-0",
    isExpanded ? "phonetic-family-node__arrow--expanded" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Box variant="dark" padding="md" className="phonetic-family-node radius-lg overflow-hidden">
      {/* Clickable header */}
      <div
        className="phonetic-family-node__header flex items-center gap-sm p-xs"
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label={`${family.phoneticPattern} (${family.pinyin}) — ${family.description} — ${family.memberCount} characters`}
        onClick={toggleExpanded}
        onKeyDown={handleKeyDown}
      >
        {/* Expand/collapse arrow */}
        <span className={arrowClass} aria-hidden="true">
          ▶
        </span>

        {/* Phonetic glyph */}
        <span className="font-xl text-primary lh-1 shrink-0">{family.phoneticPattern}</span>

        {/* Pinyin */}
        <span className="font-sm text-primary-light font-italic shrink-0">{family.pinyin}</span>

        {/* Description / meaning */}
        <span className="font-sm text-muted flex-1 truncate">— {family.description}</span>

        {/* Character count */}
        <span className="font-xs text-secondary whitespace-nowrap shrink-0">
          {family.memberCount} character{family.memberCount !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Expanded member list */}
      {isExpanded && (
        <div className="phonetic-family-node__members flex-col gap-xs p-sm pt-md" role="list">
          {displayFamily.members.length === 0 ? (
            <p className="text-muted font-sm p-sm">(no members)</p>
          ) : (
            family.members.map((member) => (
              <div
                key={member.glyph}
                className="phonetic-family-node__member-row flex items-center gap-sm p-xs"
                role="listitem"
              >
                {/* Character glyph — opens Hub */}
                <Button
                  variant="ghost"
                  className="flex-1 flex items-center gap-sm"
                  onClick={() => handleMemberClick(member)}
                  aria-label={`${member.glyph} — ${member.pinyin} — ${member.meaning}`}
                >
                  <span className="font-md text-primary lh-1 shrink-0 text-center">
                    {member.glyph}
                  </span>
                  <span className="font-sm text-primary-light lh-1">{member.pinyin}</span>
                  <span className="font-xs text-muted lh-1">—</span>
                  <span className="font-xs text-muted lh-1 flex-1 truncate">{member.meaning}</span>
                </Button>

                {/* Classification badge */}
                {member.classification && (
                  <span className="shrink-0">
                    <ClassificationBadge
                      classification={member.classification}
                      size="sm"
                      showLabel={false}
                    />
                  </span>
                )}

                {/* Hub link */}
                <Button
                  variant="ghost"
                  className="font-xs p-xs radius-md transition-fast whitespace-nowrap shrink-0"
                  onClick={() => handleMemberClick(member)}
                  aria-label={`Open ${member.glyph} in Character Detail Hub`}
                  title="Open in Character Detail Hub"
                >
                  Hub ▸
                </Button>
              </div>
            ))
          )}
        </div>
      )}
    </Box>
  );
}
