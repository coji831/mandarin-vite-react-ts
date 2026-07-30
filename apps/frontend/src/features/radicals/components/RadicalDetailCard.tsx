/**
 * @file components/RadicalDetailCard.tsx
 * @description Dashboard-style detail card for a selected radical
 * Story 19.2: Radical Detail Card
 *
 * Layout (desktop):
 * ┌──────────┬────────────────────────────┐
 * │  Glyph   │  Pinyin · Meaning          │
 * │  (large) │  ★ badges · meta inline    │
 * ├──────────┴────────────────────────────┤
 * │ 📖 Etymology  │ ✏️ Variant Forms      │
 * ├───────────────────────────────────────┤
 * │ 🎯 Example Characters                 │
 * ├───────────────────────────────────────┤
 * │ 📝 Notes                              │
 * └───────────────────────────────────────┘
 */

import { useState, useEffect, useCallback } from "react";
import type { RadicalData } from "../types";
import { ExampleCharGrid } from "./ExampleCharGrid";
import { Box, Modal, Skeleton } from "shared/components";
import { radicalsService } from "../services/radicalsService";
import "./RadicalDetailCard.css";

interface RadicalDetailCardProps {
  radical: RadicalData;
  onClose: () => void;
}

export function RadicalDetailCard({ radical, onClose }: RadicalDetailCardProps) {
  const [characters, setCharacters] = useState<
    Array<{
      glyph: string;
      pinyin: string;
      meaning: string;
      classification?: string | null;
      etymology?: string | null;
    }>
  >([]);
  const [charsLoading, setCharsLoading] = useState(true);
  const [charsError, setCharsError] = useState<string | null>(null);

  const fetchCharacters = useCallback(async () => {
    setCharsLoading(true);
    setCharsError(null);
    try {
      const result = await radicalsService.getRadicalCharacters(radical.id);
      setCharacters(result.characters);
    } catch {
      setCharsError("Failed to load example characters for this radical.");
    } finally {
      setCharsLoading(false);
    }
  }, [radical.id]);

  useEffect(() => {
    fetchCharacters();
  }, [fetchCharacters]);

  const hasNameDiffers = radical.name_chinese && radical.name_chinese !== radical.glyph;
  const hasVariants = radical.alternate_glyphs.length > 0;

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      size="lg"
      title={`${radical.glyph} (${radical.meaning})`}
    >
      <div className="radical-detail-card flex flex-col gap-md">
        {/* ── Hero: glyph | info side-by-side ── */}
        <div className="rdc__hero flex gap-lg items-center">
          <span className="rdc__glyph text-primary lh-1 shrink-0 text-center">{radical.glyph}</span>
          <div className="rdc__info flex-1 flex flex-col gap-xs">
            <span className="rdc__pinyin font-lg text-primary-light font-italic">
              {radical.name_pinyin}
            </span>
            <h2 className="rdc__meaning font-xl text-primary m-0 text-capitalize">
              {radical.meaning}
            </h2>
            <div className="rdc__badges flex flex-wrap gap-xs">
              {radical.is_recommended && (
                <span
                  className="font-xs text-warning inline-flex items-center gap-xs bg-warning-bg border-warning-border border-1 radius-sm"
                  title="Top 20 recommended radical — covers ~70% of common characters"
                >
                  ★ Top 20
                </span>
              )}
              {radical.metadata?.is_also_character && (
                <span className="font-xs inline-flex items-center gap-xs bg-surface-light-5 border-surface-light-10 border-1 radius-sm">
                  Also a character: {radical.glyph} ({radical.meaning})
                </span>
              )}
            </div>
            <div className="rdc__meta font-sm text-muted flex flex-wrap items-center gap-xs">
              <span>Kangxi #{radical.kangxi_index}</span>
              <span className="rdc__meta-sep op-40">·</span>
              <span>
                {radical.stroke_count} stroke{radical.stroke_count !== 1 ? "s" : ""}
              </span>
              {radical.metadata?.frequency_rank && (
                <>
                  <span className="rdc__meta-sep op-40">·</span>
                  <span>Freq #{radical.metadata.frequency_rank}</span>
                </>
              )}
              {hasNameDiffers && (
                <>
                  <span className="rdc__meta-sep op-40">·</span>
                  <span>Chinese name: {radical.name_chinese}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Two-column info grid: etymology + variants ── */}
        <div className="rdc__info-grid grid gap-sm">
          {/* Etymology */}
          {radical.metadata?.etymology && (
            <Box
              variant="dark-accent-primary"
              padding="md"
              className="rdc__etymology flex flex-col gap-xs"
            >
              <span className="font-xs text-muted text-uppercase tracking-wide">Etymology</span>
              <p className="font-sm text-secondary">{radical.metadata.etymology}</p>
            </Box>
          )}

          {/* Variant forms */}
          {hasVariants && (
            <div className="rdc__variants flex flex-col gap-xs">
              <span className="font-xs text-muted text-uppercase tracking-wide">Variant Forms</span>
              <div className="rdc__variants-list flex flex-wrap gap-xs items-center">
                {radical.alternate_glyphs.map((alt) => (
                  <Box
                    key={alt}
                    variant="chip"
                    as="span"
                    className="rdc__variant-chip inline-flex items-center justify-center font-lg text-primary bg-surface-light-5"
                  >
                    {alt}
                  </Box>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Example characters ── */}
        {charsLoading ? (
          <div className="flex justify-center p-md">
            <Skeleton variant="custom" height="80px" className="w-full radius-lg" />
          </div>
        ) : charsError ? (
          <div className="flex flex-col items-center gap-sm p-md">
            <p className="font-sm text-danger">{charsError}</p>
            <button onClick={fetchCharacters} className="btn btn-sm btn-outline">
              Retry
            </button>
          </div>
        ) : characters.length > 0 ? (
          <ExampleCharGrid characters={characters} />
        ) : (
          <div className="flex justify-center p-md">
            <p className="font-sm text-muted">No example characters found for this radical.</p>
          </div>
        )}

        {/* ── Notes (always visible) — divider via Box, no directional border/padding ── */}
        {radical.metadata?.notes && (
          <>
            <Box variant="divider" className="w-full" />
            <div className="flex flex-col gap-xs p-sm">
              <span className="font-xs text-muted text-uppercase tracking-wide">Notes</span>
              <p className="font-sm text-secondary">{radical.metadata.notes}</p>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
