/**
 * @file components/RadicalDetailCard.tsx
 * @description Expandable detail card for a selected radical
 * Story 19.2: Radical Detail Card
 */

import { useEffect, useRef } from "react";
import type { RadicalData } from "../types";
import { ExampleCharGrid } from "./ExampleCharGrid";

interface RadicalDetailCardProps {
  radical: RadicalData;
  onClose: () => void;
}

export function RadicalDetailCard({ radical, onClose }: RadicalDetailCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const hskCharacters = radical.metadata.hsk_characters ?? [];

  // Focus the card on mount for accessibility
  useEffect(() => {
    cardRef.current?.focus();
  }, []);

  return (
    <>
      {/* Backdrop overlay */}
      <div className="radical-detail-card__backdrop" onClick={onClose} aria-hidden="true" />

      {/* Detail card overlay */}
      <div
        ref={cardRef}
        className="radical-detail-card"
        role="dialog"
        aria-label={`Details for ${radical.meaning}`}
        tabIndex={-1}
      >
        <div className="radical-detail-card__panel">
          <button
            className="radical-detail-card__close"
            onClick={onClose}
            type="button"
            aria-label="Close detail card"
          >
            ×
          </button>

          {/* Title bar */}
          <div className="radical-detail-card__title-bar">
            <span className="radical-detail-card__title">
              Radical Detail: {radical.glyph} ({radical.meaning})
            </span>
            {radical.is_recommended && (
              <span className="radical-detail-card__top-badge" title="Top 20 recommended radical">
                ★ Top 20
              </span>
            )}
          </div>

          {/* Hero section */}
          <div className="radical-detail-card__hero">
            <span className="radical-detail-card__glyph">{radical.glyph}</span>
            <div className="radical-detail-card__hero-text">
              <span className="radical-detail-card__pinyin">{radical.name_pinyin}</span>
              <h2 className="radical-detail-card__meaning">{radical.meaning}</h2>
            </div>
          </div>

          {/* Name (Chinese) section */}
          {radical.name_chinese && (
            <div className="radical-detail-card__name-line">
              <span className="radical-detail-card__meta-label">Name</span>
              <span className="radical-detail-card__name-value">
                {radical.name_chinese} ({radical.meaning})
              </span>
            </div>
          )}

          {/* Metadata section */}
          <div className="radical-detail-card__meta">
            <div className="radical-detail-card__meta-item">
              <span className="radical-detail-card__meta-label">Strokes</span>
              <span className="radical-detail-card__meta-value">{radical.stroke_count}</span>
            </div>
            <div className="radical-detail-card__meta-item">
              <span className="radical-detail-card__meta-label">Kangxi Index</span>
              <span className="radical-detail-card__meta-value">#{radical.kangxi_index}</span>
            </div>
          </div>

          {/* Alternate glyphs */}
          {radical.alternate_glyphs.length > 0 && (
            <div className="radical-detail-card__alts">
              <span className="radical-detail-card__meta-label">Also written as</span>
              <div className="radical-detail-card__alts-list">
                {radical.alternate_glyphs.map((alt) => (
                  <span key={alt} className="radical-detail-card__alt-chip">
                    {alt}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Example characters */}
          {hskCharacters.length > 0 && <ExampleCharGrid characters={hskCharacters} />}

          {/* Mnemonic section — placeholder for Epic 20 */}
          <div className="radical-detail-card__mnemonic-placeholder">
            <span className="font-xs text-muted">
              Generate story for one of {hskCharacters.length} characters
            </span>
            <button className="mnemonic-btn" disabled title="Coming in Epic 20" type="button">
              Generate Story
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
