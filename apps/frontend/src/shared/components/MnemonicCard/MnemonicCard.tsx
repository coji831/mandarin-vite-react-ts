/**
 * @file MnemonicCard.tsx
 * @description Main MnemonicCard component — classification-aware mnemonic display.
 * Story 21.20: Classification-Aware Mnemonic UI
 *
 * Receives classification, story, radicalIds, character, and action props.
 * Selects the appropriate layout via resolveEffectiveClassification().
 * Shows ClassificationBadge in card header and regeneration guidance below.
 */

import { Button, Skeleton, ClassificationBadge } from "shared/components";
import { PictographLayout } from "./PictographLayout";
import { PhonoSemanticLayout } from "./PhonoSemanticLayout";
import { CompoundIdeographLayout } from "./CompoundIdeographLayout";
import { SimpleIdeographLayout } from "./SimpleIdeographLayout";
import { getRegenerationTip } from "./regenerationGuidance";
import { renderStoryText } from "./renderStoryText";
import { resolveEffectiveClassification } from "./layoutSelection";
import type { EffectiveLayout } from "./layoutSelection";
import "./MnemonicCard.css";

export type { EffectiveLayout };

export interface MnemonicCardProps {
  character: string;
  classification: string | null | undefined;
  radicalIds: string[];
  story: string;
  isEdited: boolean;
  onEdit?: () => void;
  onRegenerate?: () => void;
  isLoading?: boolean;
  isGenerating?: boolean;
}

function MnemonicCardSkeleton({ isGenerating = false }: { isGenerating?: boolean }) {
  return (
    <div
      className="mnemonic-card mnemonic-card__loading"
      role="status"
      aria-label={isGenerating ? "Generating mnemonic story" : "Loading mnemonic story"}
    >
      <div className="mnemonic-card__skeleton-header">
        <Skeleton variant="custom" className="mnemonic-card__skeleton-badge" />
      </div>
      <div className="mnemonic-card__skeleton-body">
        <Skeleton variant="custom" className="mnemonic-card__skeleton-line" />
        <Skeleton variant="custom" className="mnemonic-card__skeleton-line" />
        <Skeleton variant="custom" className="mnemonic-card__skeleton-line mnemonic-card__skeleton-line--short" />
      </div>
      <p className="text-tertiary font-xs m-0 mt-md">
        {isGenerating ? "Creating mnemonic story…" : "Loading story…"}
      </p>
    </div>
  );
}

function LayoutRenderer({ effectiveLayout, character, story, radicalIds, isEdited }: {
  effectiveLayout: EffectiveLayout;
  character: string;
  story: string;
  radicalIds: string[];
  isEdited: boolean;
}) {
  switch (effectiveLayout) {
    case "pictograph":
      return <PictographLayout character={character} story={story} isEdited={isEdited} />;
    case "phono_semantic":
      return (
        <PhonoSemanticLayout
          character={character}
          story={story}
          radicalIds={radicalIds}
          isEdited={isEdited}
        />
      );
    case "compound_ideograph":
      return (
        <CompoundIdeographLayout
          character={character}
          story={story}
          radicalIds={radicalIds}
          isEdited={isEdited}
        />
      );
    case "simple_ideograph":
      return <SimpleIdeographLayout character={character} story={story} isEdited={isEdited} />;
    case "default":
    default:
      // Fallback: render story text directly, similar to old MnemonicDisplay
      return (
        <div>
          {story ? (
            <div className="mnemonic-card__story-container">
              <div className="mnemonic-card__story">{renderStoryText(story)}</div>
              {isEdited && <span className="mnemonic-card__edited-tag">(edited)</span>}
            </div>
          ) : (
            <p className="text-tertiary font-sm m-0 lh-normal">
              No mnemonic story is available for this character.
            </p>
          )}
        </div>
      );
  }
}

export function MnemonicCard({
  character,
  classification,
  radicalIds = [],
  story,
  isEdited = false,
  onEdit,
  onRegenerate,
  isLoading = false,
  isGenerating = false,
}: MnemonicCardProps) {
  // Loading state
  if (isLoading || isGenerating) {
    return <MnemonicCardSkeleton isGenerating={isGenerating} />;
  }

  const effectiveLayout = resolveEffectiveClassification(classification, radicalIds);
  const regenerationTip = effectiveLayout === "default"
    ? getRegenerationTip("default")
    : getRegenerationTip(effectiveLayout);

  return (
    <div className="mnemonic-card" aria-label={`Mnemonic for ${character}`}>
      {/* Card Header */}
      <div className="mnemonic-card__header">
        <div className="mnemonic-card__header-left">
          <ClassificationBadge classification={classification} size="sm" />
        </div>
        <div className="mnemonic-card__header-actions">
          {onEdit && (
            <Button variant="icon" size="sm" onClick={onEdit} aria-label="Edit mnemonic story">
              ✏️
            </Button>
          )}
          {onRegenerate && (
            <Button
              variant="icon"
              size="sm"
              onClick={onRegenerate}
              aria-label="Regenerate mnemonic story"
            >
              🔄
            </Button>
          )}
        </div>
      </div>

      {/* Layout Content */}
      <LayoutRenderer
        effectiveLayout={effectiveLayout}
        character={character}
        story={story}
        radicalIds={radicalIds}
        isEdited={isEdited}
      />

      {/* Regeneration Guidance */}
      {onRegenerate && (
        <div className="mnemonic-card__guidance">
          <span aria-hidden="true">💡</span>
          <span>Tip: {regenerationTip}</span>
        </div>
      )}
    </div>
  );
}
