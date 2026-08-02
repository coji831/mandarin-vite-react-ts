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
import { Box } from "shared/components";
import "./StrokeAnimationTab.css";

export function StrokeAnimationTab() {
  const [character, setCharacter] = useState<string>("水");

  return (
    <div className="stroke-anim-tab flex-col gap-xs mx-auto">
      <Box variant="dark" padding="md" className="stroke-anim-header flex-col gap-xs">
        <h2 className="font-xl fw-700 text-secondary m-0">Stroke Animations</h2>
        <p className="font-sm text-muted m-0">
          Interactive stroke order animations · Type any character to begin
        </p>
        <p className="font-sm text-muted m-0">
          Watch, pause, and step through each stroke at your own pace
        </p>
      </Box>

      {/* Search + Quick Select — merged into one compact bar */}
      <Box
        variant="dark-alt"
        padding="xs"
        className="stroke-anim-search-bar flex-center gap-xs flex-wrap"
      >
        <SuggestionPanel onSelect={setCharacter} currentCharacter={character} compact />
        <div className="stroke-anim-search-divider shrink-0" />
        <CharacterSearchBar onCharacterSelect={setCharacter} compact />
      </Box>

      <AnimationPanel character={character} />
    </div>
  );
}
