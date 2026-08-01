/**
 * @file components/PictographGallery.tsx
 * @description Pictograph Gallery tab component — displays pictographs with MnemonicCard
 * Story 21.21: Pictograph Warmup (Gallery + Mini-game)
 *
 * Reuses MnemonicCard with classification="pictograph" (from Story 21.20).
 * Displays hardcoded pictograph data from pictographGalleryService.
 * Oracle bone evolution images are a future enhancement (ancientFormUrl prop is ready).
 */

import { useState } from "react";
import { Button, MnemonicCard, ClassificationBadge } from "shared/components";
import { PICTOGRAPH_SET } from "../services/pictographGalleryService";
import type { PictographData } from "../services/pictographGalleryService";
import { PictographMatchGame } from "./PictographMatchGame";
import "./PictographGallery.css";

type GalleryView = "gallery" | "detail" | "game";

interface DetailState {
  data: PictographData;
}

export function PictographGallery() {
  const [view, setView] = useState<GalleryView>("gallery");
  const [detail, setDetail] = useState<DetailState | null>(null);

  // ─── Gallery View ────────────────────────────────────────────────────

  if (view === "gallery") {
    if (PICTOGRAPH_SET.length === 0) {
      return (
        <div className="pictograph-gallery">
          <div className="pictograph-gallery__empty">
            <div className="pictograph-gallery__empty-icon">🖼️</div>
            <p>No pictographs available yet. Check back soon!</p>
          </div>
        </div>
      );
    }

    return (
      <div className="pictograph-gallery">
        <div className="pictograph-gallery__header">
          <h2 className="pictograph-gallery__title">🖼️ Pictograph Gallery</h2>
          <p className="pictograph-gallery__subtitle">
            Discover the ancient origins of Chinese characters — tap any card to learn more
          </p>
        </div>

        <div className="pictograph-gallery__grid">
          {PICTOGRAPH_SET.map((pictograph) => (
            <div
              key={pictograph.glyph}
              className="pictograph-gallery__card hover-lift-sm"
              onClick={() => setDetail({ data: pictograph })}
              role="button"
              tabIndex={0}
              aria-label={`View details for ${pictograph.glyph} (${pictograph.meaning})`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setDetail({ data: pictograph });
                }
              }}
            >
              <MnemonicCard
                character={pictograph.glyph}
                classification="pictograph"
                radicalIds={[]}
                story={pictograph.etymology}
                isEdited={false}
              />
            </div>
          ))}
        </div>

        <div className="flex-center mt-md">
          <Button onClick={() => setView("game")} variant="primary">
            🎮 Play Pictograph Match
          </Button>
        </div>
      </div>
    );
  }

  // ─── Detail View ─────────────────────────────────────────────────────

  if (view === "detail" && detail) {
    return (
      <div className="pictograph-gallery">
        <Button
          className="mb-md"
          onClick={() => {
            setView("gallery");
            setDetail(null);
          }}
          variant="ghost"
        >
          ← Back to Gallery
        </Button>

        <div className="pictograph-gallery__detail">
          <ClassificationBadge classification="pictograph" size="lg" />
          <MnemonicCard
            character={detail.data.glyph}
            classification="pictograph"
            radicalIds={[]}
            story={detail.data.etymology}
            isEdited={false}
          />
        </div>
      </div>
    );
  }

  // ─── Mini-Game View ──────────────────────────────────────────────────

  return (
    <div className="pictograph-gallery">
      <PictographMatchGame
        onBackToGallery={() => {
          setView("gallery");
          setDetail(null);
        }}
      />
    </div>
  );
}
