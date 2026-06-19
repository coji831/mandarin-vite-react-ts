/**
 * @file StrokeAnimationTab.tsx
 * @description Stroke Animations page — orchestrates controlled components
 * Story 18.4: Stroke Order Reference & Animations
 *
 * Owns: character state (lifted for sibling communication)
 * Composes: CharacterSearchBar, AnimationPanel, SuggestionPanel
 */

import { useState } from "react";

import {
  CharacterSearchBar,
  AnimationPanel,
  SuggestionPanel,
} from "features/foundations/components";
import { useCharacterHub } from "shared/hooks";
import "./StrokeAnimationTab.css";

export function StrokeAnimationTab() {
  const [character, setCharacter] = useState<string>("水");
  const { openHub } = useCharacterHub();

  return (
    <div className="stroke-anim-tab">
      <CharacterSearchBar onCharacterSelect={setCharacter} />
      <AnimationPanel character={character} onCharacterClick={(char) => openHub(char)} />
      <SuggestionPanel onSelect={setCharacter} currentCharacter={character} />
    </div>
  );
}
