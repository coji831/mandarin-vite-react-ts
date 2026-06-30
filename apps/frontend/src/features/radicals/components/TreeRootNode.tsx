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
import { Button } from "shared/components";
import { useCharacterHub } from "shared/hooks";
import type { RadicalData } from "../types";
import { BranchNode } from "./BranchNode";
import "./TreeRootNode.css";

interface TreeRootNodeProps {
  radical: RadicalData;
  characters: Array<{ glyph: string; pinyin: string; meaning: string }>;
}

export function TreeRootNode({ radical, characters }: TreeRootNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { openHub } = useCharacterHub();

  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleCollapse = useCallback(() => {
    setIsExpanded(false);
  }, []);

  const handleRadicalClick = useCallback(() => {
    openHub(radical.glyph, radical.name_pinyin);
  }, [radical, openHub]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleExpand();
      }
    },
    [toggleExpand],
  );

  return (
    <div className="tree-root-node card-dark">
      {/* Root node header */}
      <div className="tree-root-node__header">
        <button
          className="tree-root-node__toggle"
          onClick={toggleExpand}
          onKeyDown={handleKeyDown}
          type="button"
          aria-expanded={isExpanded}
          aria-label={`${isExpanded ? "Collapse" : "Expand"} ${radical.meaning}`}
        >
          <span
            className={`tree-root-node__chevron ${isExpanded ? "tree-root-node__chevron--expanded" : ""}`}
            aria-hidden="true"
          >
            ▶
          </span>
        </button>

        <div
          className="tree-root-node__radical"
          onClick={handleRadicalClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleRadicalClick();
            }
          }}
          role="button"
          tabIndex={0}
          title={`${radical.stroke_count} stroke${radical.stroke_count !== 1 ? "s" : ""}`}
          aria-label={`${radical.glyph} — ${radical.meaning} — ${radical.stroke_count} strokes`}
        >
          <span className="tree-root-node__glyph">{radical.glyph}</span>
          <div className="tree-root-node__info">
            <span className="font-md text-primary fw-500">{radical.meaning}</span>
            <span className="font-xs text-muted">{radical.name_pinyin}</span>
          </div>
        </div>

        <span className="font-xs radius-pill tree-root-node__badge">
          {characters.length} character{characters.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Expandable character branches */}
      <div
        className={`tree-root-node__branches ${isExpanded ? "tree-root-node__branches--expanded" : ""}`}
        role="region"
        aria-label={`Characters for ${radical.meaning}`}
      >
        <div className="tree-root-node__branches-inner">
          {characters.length > 0 ? (
            <div className="tree-root-node__character-column">
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
          <div className="tree-root-node__footer">
            <Button variant="secondary" size="sm" onClick={handleCollapse}>
              🌲 Collapse
            </Button>
            <Button variant="secondary" size="sm" disabled title="Coming in Epic 20">
              Generate stories for all ▸
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
