/**
 * @file components/RadicalDetailContent.tsx
 * @description Presentational body of the radical detail view — hero, etymology,
 * variant forms, example characters, and notes. Data-accepting so it can render
 * inside the shared LexicalHub (RadicalHub) or a standalone Modal
 * (RadicalDetailCard) without duplication.
 *
 * Story 19.2: Radical Detail Card
 * Story 21.x (visual wave): Body extracted from RadicalDetailCard for reuse in
 * the `radical` lexical hub — exactly one dialog at a time.
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
import { Box, Button, Skeleton } from "shared/components";
import { radicalsService } from "../services/radicalsService";
import "./RadicalDetailCard.css";

export interface ExampleCharacter {
  glyph: string;
  pinyin: string;
  meaning: string;
  classification?: string | null;
  etymology?: string | null;
}

interface RadicalDetailContentProps {
  radical: RadicalData;
  /** Optional pre-fetched example characters — bypasses the API fetch (Storybook). */
  characters?: ExampleCharacter[];
}

export function RadicalDetailContent({
  radical,
  characters: charactersProp,
}: RadicalDetailContentProps) {
  const [characters, setCharacters] = useState<ExampleCharacter[]>([]);
  const [charsLoading, setCharsLoading] = useState(!charactersProp);
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
    // Storybook mode — characters provided via prop; skip the API fetch.
    if (charactersProp) return;
    fetchCharacters();
  }, [fetchCharacters, charactersProp]);

  const effectiveCharacters = charactersProp ?? characters;
  const effectiveCharsLoading = charactersProp ? false : charsLoading;
  const effectiveCharsError = charactersProp ? null : charsError;

  const hasNameDiffers = radical.name_chinese && radical.name_chinese !== radical.glyph;
  const hasVariants = radical.alternate_glyphs.length > 0;

  return (
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
      {effectiveCharsLoading ? (
        <div className="flex justify-center p-md">
          <Skeleton variant="custom" height="80px" className="w-full radius-lg" />
        </div>
      ) : effectiveCharsError ? (
        <div className="flex flex-col items-center gap-sm p-md">
          <p className="font-sm text-danger">{effectiveCharsError}</p>
          <Button variant="secondary" size="sm" onClick={fetchCharacters}>
            Retry
          </Button>
        </div>
      ) : effectiveCharacters.length > 0 ? (
        <ExampleCharGrid characters={effectiveCharacters} />
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
  );
}
