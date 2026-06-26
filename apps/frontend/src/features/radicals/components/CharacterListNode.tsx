/**
 * @file components/CharacterListNode.tsx
 * @description Phase 2 character list view for a selected radical
 * Story 19.4: Radical Trees (Phase 3)
 *
 * Shows all characters containing the selected radical, each with pinyin
 * and meaning subtext. Each character is clickable → opens Character Detail Hub.
 */

import type { RadicalData } from "../types";
import { BranchNode } from "./BranchNode";
import "./CharacterListNode.css";

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
    <div className="character-list-node">
      <div className="character-list-node__header">
        <span className="character-list-node__radical-glyph">{radical.glyph}</span>
        <div className="character-list-node__radical-info">
          <span className="character-list-node__radical-meaning">{radical.meaning}</span>
          <span className="character-list-node__radical-pinyin">{radical.name_pinyin}</span>
        </div>
        <span className="character-list-node__count">
          {characters.length} character{characters.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div
        className="character-list-node__grid"
        role="list"
        aria-label="Characters containing this radical"
      >
        {characters.map((ch) => (
          <BranchNode key={ch.glyph} character={ch.glyph} pinyin={ch.pinyin} meaning={ch.meaning} ariaRole="listitem" />
        ))}
      </div>
    </div>
  );
}
