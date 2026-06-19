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
import "./StrokeAnimationTab.css";

export function StrokeAnimationTab() {
  const [character, setCharacter] = useState<string>("水");

  return (
    <div className="stroke-anim-tab">
      <CharacterSearchBar onCharacterSelect={setCharacter} />
      <AnimationPanel character={character} />
      <SuggestionPanel onSelect={setCharacter} currentCharacter={character} />
    </div>
  );
}
