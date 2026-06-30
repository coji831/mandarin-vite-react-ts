/**
 * @file components/Phase2BrowseView.tsx
 * @description Phase 2 browse mode — selected radical + grid + back button
 * Story 19.4: Radical Trees (Phase 3)
 *
 * When a radical is selected, shows a back button and CharacterListNode.
 * When no radical is selected, shows a prompt and RadicalGrid.
 */

import { useCallback } from "react";
import { Button } from "shared/components";
import type { RadicalData } from "../types";
import { RadicalGrid } from "./RadicalGrid";
import { CharacterListNode } from "./CharacterListNode";

interface Phase2BrowseViewProps {
  selectedRadical: RadicalData | null;
  radicals: RadicalData[];
  error: string | null;
  refetch: () => void;
  onRadicalClick: (radical: RadicalData) => void;
  onBack: () => void;
  getCharactersForRadical: (
    radical: RadicalData,
  ) => Array<{ glyph: string; pinyin: string; meaning: string }>;
}

export function Phase2BrowseView({
  selectedRadical,
  radicals,
  error,
  refetch,
  onRadicalClick,
  onBack,
  getCharactersForRadical,
}: Phase2BrowseViewProps) {
  if (selectedRadical) {
    return (
      <div className="p-md">
        <Button variant="secondary" size="sm" onClick={onBack}>
          ← Back to radicals
        </Button>
        <CharacterListNode
          radical={selectedRadical}
          characters={getCharactersForRadical(selectedRadical)}
        />
      </div>
    );
  }

  return (
    <div className="p-md">
      <p className="text-secondary font-sm p-md text-center">
        Select a radical to see characters containing it.
      </p>
      <RadicalGrid
        radicals={radicals}
        isLoading={false}
        error={error}
        onRadicalClick={onRadicalClick}
        onRetry={refetch}
      />
    </div>
  );
}
