/**
 * @file components/CharacterListNode.tsx
 * @description Phase 2 character list view for a selected radical
 * Story 19.4: Radical Trees (Phase 3)
 *
 * Shows all characters containing the selected radical, each with pinyin
 * and meaning subtext. Each character is clickable → opens Character Detail Hub.
 */

import { Box } from "shared/components";
import type { RadicalData } from "../types";
import { BranchNode } from "./BranchNode";

interface CharacterListNodeProps {
  radical: RadicalData;
  characters: Array<{ glyph: string; pinyin: string; meaning: string }>;
}

export function CharacterListNode({ radical, characters }: CharacterListNodeProps) {
  if (characters.length === 0) {
    return (
      <div className="character-list-node p-md">
        <p className="text-muted font-sm">No characters found for this radical.</p>
      </div>
    );
  }

  return (
    <Box variant="surface" className="character-list-node radius-lg overflow-hidden">
      <Box
        variant="header"
        className="character-list-node__header flex-center gap-md bg-surface-light-5"
        padding="md"
      >
        <span className="character-list-node__radical-glyph font-3xl text-primary-light lh-1">
          {radical.glyph}
        </span>
        <div className="character-list-node__radical-info flex-col flex-1">
          <span className="font-md text-primary fw-500">{radical.meaning}</span>
          <span className="font-sm text-secondary">{radical.name_pinyin}</span>
        </div>
        <span className="character-list-node__count font-xs text-muted whitespace-nowrap">
          {characters.length} character{characters.length !== 1 ? "s" : ""}
        </span>
      </Box>

      <div
        className="character-list-node__grid flex-wrap gap-md p-md"
        role="list"
        aria-label="Characters containing this radical"
      >
        {characters.map((ch) => (
          <BranchNode
            key={ch.glyph}
            character={ch.glyph}
            pinyin={ch.pinyin}
            meaning={ch.meaning}
            ariaRole="listitem"
          />
        ))}
      </div>
    </Box>
  );
}
