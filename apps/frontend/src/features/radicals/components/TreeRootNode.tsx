/**
 * @file components/TreeRootNode.tsx
 * @description Phase 3 tree root node — a mastered radical with expandable character branches
 * Story 19.4: Radical Trees (Phase 3)
 *
 * Shows radical glyph, meaning, pinyin. Expandable to show character branches
 * with smooth expand/collapse animation using CSS transitions.
 * Footer contains Collapse and "Generate stories" buttons.
 */

import { useState, useCallback } from "react";
import { Box, Button, Chip, Icon } from "shared/components";
import { openHub } from "shared/store";
import type { RadicalData } from "../types";
import { BranchNode } from "./BranchNode";
import "./TreeRootNode.css";

interface TreeRootNodeProps {
  radical: RadicalData;
  characters: Array<{ glyph: string; pinyin: string; meaning: string }>;
}

export function TreeRootNode({ radical, characters }: TreeRootNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleCollapse = useCallback(() => {
    setIsExpanded(false);
  }, []);

  const handleRadicalClick = useCallback(() => {
    openHub({ entityType: "character", entityId: radical.glyph, label: radical.name_pinyin });
  }, [radical]);

  return (
    <Box
      variant="dark"
      padding="md"
      className="tree-root-node transition-border-color radius-lg overflow-hidden"
    >
      {/* Root node header */}
      <div className="tree-root-node__header flex-center gap-sm p-sm bg-surface-dark">
        <Button
          variant="icon"
          className="tree-root-node__toggle text-secondary shrink-0 transition-colors"
          onClick={toggleExpand}
          aria-expanded={isExpanded}
          aria-label={`${isExpanded ? "Collapse" : "Expand"} ${radical.meaning}`}
        >
          <span
            className={`tree-root-node__chevron inline-block font-xs lh-1 transition-transform ${isExpanded ? "tree-root-node__chevron--expanded" : ""}`}
            aria-hidden="true"
          >
            ▶
          </span>
        </Button>

        <Button
          variant="ghost"
          className="tree-root-node__radical gap-md flex-1"
          onClick={handleRadicalClick}
          title={`${radical.stroke_count} stroke${radical.stroke_count !== 1 ? "s" : ""}`}
          aria-label={`${radical.glyph} — ${radical.meaning} — ${radical.stroke_count} strokes`}
        >
          <span className="tree-root-node__glyph font-3xl text-accent lh-1 text-center">
            {radical.glyph}
          </span>
          <div className="tree-root-node__info flex-col">
            <span className="font-md text-primary fw-500">{radical.meaning}</span>
            <span className="font-xs text-muted">{radical.name_pinyin}</span>
          </div>
        </Button>

        {/* Character-count pill — non-interactive shared Chip (count slot) */}
        <Chip
          interactive={false}
          variant="surface"
          size="sm"
          count={`${characters.length} character${characters.length !== 1 ? "s" : ""}`}
          className="shrink-0"
        />
      </div>

      {/* Expandable character branches */}
      <div
        className={`tree-root-node__branches grid ${isExpanded ? "tree-root-node__branches--expanded" : ""}`}
        role="region"
        aria-label={`Characters for ${radical.meaning}`}
      >
        <div className="tree-root-node__branches-inner overflow-hidden">
          {characters.length > 0 ? (
            <div className="tree-root-node__character-column bg-surface-light-3 flex-col p-md">
              {characters.map((ch) => (
                <BranchNode
                  key={ch.glyph}
                  character={ch.glyph}
                  pinyin={ch.pinyin}
                  meaning={ch.meaning}
                  showConnector={true}
                />
              ))}
            </div>
          ) : (
            <p className="text-muted font-sm p-sm">No characters mapped for this radical.</p>
          )}

          {/* Tree footer with action buttons */}
          <Box
            variant="divider"
            className="tree-root-node__footer bg-surface-light-3 flex gap-sm"
            padding="md"
          >
            <Button variant="secondary" size="sm" onClick={handleCollapse}>
              <Icon name="tree" size={16} aria-hidden />
              Collapse
            </Button>
            <Button variant="secondary" size="sm" disabled title="Coming in Epic 20">
              Generate stories for all ▸
            </Button>
          </Box>
        </div>
      </div>
    </Box>
  );
}
