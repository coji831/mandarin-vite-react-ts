/**
 * @file components/AnimationPanel.tsx
 * @description Hanzi Writer animation panel with CharacterStrokePlayer
 * Story 18.4: Stroke Order Reference & Animations
 *
 * Wraps CharacterStrokePlayer in "full" mode within the section/Box container.
 * CharacterStrokePlayer now lives in shared/components/CharacterStroke.
 */

import { Box, CharacterStrokePlayer } from "shared/components";

type AnimationPanelProps = {
  character: string;
  onCharacterClick?: (character: string) => void;
  onPlayAudio?: (character: string) => void;
};

export function AnimationPanel({ character, onCharacterClick, onPlayAudio }: AnimationPanelProps) {
  return (
    <section className="flex-col">
      <Box variant="dark-alt" padding="sm" className="stroke-anim-card flex-col-center gap-xs">
        <CharacterStrokePlayer
          character={character}
          mode="full"
          onCharacterClick={onCharacterClick}
          onPlayAudio={onPlayAudio}
        />
      </Box>
    </section>
  );
}
