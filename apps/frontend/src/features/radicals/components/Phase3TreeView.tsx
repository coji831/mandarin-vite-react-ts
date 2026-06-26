/**
 * @file components/Phase3TreeView.tsx
 * @description Phase 3 trees view — search + chips + separator + indicator + tree + tagline
 * Story 19.4: Radical Trees (Phase 3)
 *
 * Displays a search bar to filter mastered radicals, a chip-style picker,
 * separator, selected indicator, single expandable tree root node, and tagline.
 */

import { Button } from "shared/components";
import type { RadicalData } from "../types";
import { RadicalChipPicker } from "./RadicalChipPicker";
import { TreeRootNode } from "./TreeRootNode";
import "./Phase3TreeView.css";

interface Phase3TreeViewProps {
  searchQuery: string;
  filteredChips: RadicalData[];
  masteredRadicals: RadicalData[];
  activeRadical: RadicalData | null;
  progressError: string | null;
  progressLoading: boolean;
  onSearchChange: (query: string) => void;
  onChipClick: (id: string) => void;
  onRetry: () => void;
  getCharactersForRadical: (
    radical: RadicalData,
  ) => Array<{ glyph: string; pinyin: string; meaning: string }>;
}

export function Phase3TreeView({
  searchQuery,
  filteredChips,
  masteredRadicals,
  activeRadical,
  progressError,
  progressLoading,
  onSearchChange,
  onChipClick,
  onRetry,
  getCharactersForRadical,
}: Phase3TreeViewProps) {
  return (
    <>
      {/* Search bar — compact, inline (always visible in Phase 3) */}
      <div className="flex-end p-sm px-md bg-surface-dark phase3-tree-view__search-bar">
        <div className="flex-center gap-xs">
          <span className="font-sm text-muted" aria-hidden="true">
            🔍
          </span>
          <input
            className="input-base phase3-tree-view__search-input"
            type="text"
            placeholder="Filter radicals…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search mastered radicals"
          />
        </div>
      </div>

      {/* Progress loading state */}
      {progressLoading && (
        <div className="flex-col flex-center p-xl" role="status">
          <div className="phase3-tree-view__skeleton-tree" aria-hidden="true" />
          <span className="text-muted font-sm">Loading mastered radicals…</span>
        </div>
      )}

      {/* Progress error state */}
      {progressError && !progressLoading && (
        <div className="flex-col flex-center p-lg gap-md">
          <div className="alert-error">
            <p className="text-primary">{progressError}</p>
          </div>
          <Button variant="primary" size="md" onClick={onRetry}>
            Retry
          </Button>
        </div>
      )}

      {/* Empty state — no mastered radicals */}
      {!progressLoading && !progressError && masteredRadicals.length === 0 && (
        <div className="flex-col flex-center p-xl gap-sm">
          <p className="text-muted font-lg">No mastered radicals yet.</p>
          <p className="text-muted font-sm">
            Start memorizing radicals in Browse mode to build your tree.
          </p>
        </div>
      )}

      {/* Chip picker + tree */}
      {!progressLoading && !progressError && masteredRadicals.length > 0 && (
        <>
          {/* Card container for chips + separator + indicator */}
          <div className="card-dark">
            <p className="font-sm text-secondary p-md" style={{ paddingBottom: 0 }}>
              Pick a radical to expand:
            </p>

            <RadicalChipPicker
              filteredChips={filteredChips}
              activeRadicalId={activeRadical?.id ?? null}
              onChipClick={onChipClick}
            />

            {/* Separator */}
            <div className="flex-center p-sm px-md" aria-hidden="true">
              <span className="font-xs text-muted phase3-tree-view__separator-text">
                ─── Your known radicals (★ mastered) ───
              </span>
            </div>

            {/* Selected indicator */}
            {activeRadical && (
              <div className="phase3-tree-view__selected-indicator font-sm text-secondary px-md text-center">
                Selected: {activeRadical.glyph} ({activeRadical.meaning}) — known ★ — click to
                expand
              </div>
            )}
          </div>

          {/* Single tree node */}
          {activeRadical && (
            <div className="flex-col gap-md p-md" role="list" aria-label="Radical trees">
              <TreeRootNode
                key={activeRadical.id}
                radical={activeRadical}
                characters={getCharactersForRadical(activeRadical)}
              />
            </div>
          )}

          {/* Tagline */}
          <div className="phase3-tree-view__tagline text-center font-sm text-muted p-lg px-md">
            ✨ Learning through recognition — no testing. Browse freely.
          </div>
        </>
      )}
    </>
  );
}
