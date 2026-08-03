/**
 * @file components/pinyin/SlidingPinyinGrid.tsx
 * @description 2D sliding pinyin grid — scrollable/panable grid of all initial×final combinations
 * Replaces the InitialsGrid → FinalsGrid → CombinationDisplay two-step flow.
 * Features frozen row/column headers, drag-to-pan, scroll wheel, tone-colored cells, and a side detail panel.
 */

import React, { useCallback, useMemo, useRef, useState } from "react";

import { stripToneAndDigits } from "@mandarin/shared-utils";
import type { PinyinCharacterMap } from "@mandarin/shared-utils";
import { Box } from "shared/components";
import { TONE_COLORS, extractToneNumber } from "../../utils/pinyinUtils";
import { useDragToPan } from "../../hooks/useDragToPan";
import { DetailPanel } from "./DetailPanel";
import "./SlidingPinyinGrid.css";

// ─── Types ───

export interface SlidingPinyinGridProps {
  initials: Array<{ id: string; pinyin: string; ipa?: string; description: string }>;
  finals: Array<{ id: string; pinyin: string; type?: string; description: string }>;
  combinations: Array<{ initial: string; final: string; tones: (string | null)[] }>;
  /** Pinyin → character mapping (e.g. "ba" → "八") */
  charMap?: PinyinCharacterMap | null;
}

// ─── Main Component ───

function SlidingPinyinGridComponent({
  initials,
  finals,
  combinations,
  charMap,
}: SlidingPinyinGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    isDragging,
    scrollRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useDragToPan();

  // Selected combo state (replaces old popup state)
  const [selected, setSelected] = useState<{
    initial: string;
    final: string;
    tones: string[];
  } | null>(null);

  // Build lookup map: "initialId:finalId" → PinyinCombination
  const comboMap = useMemo(() => {
    const map = new Map<string, (string | null)[]>();
    for (const c of combinations) {
      map.set(`${c.initial}:${c.final}`, c.tones);
    }
    return map;
  }, [combinations]);

  // Get initials lookup
  const initialMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const i of initials) {
      map.set(i.id, i.pinyin);
    }
    return map;
  }, [initials]);

  // Get finals lookup
  const finalMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const f of finals) {
      map.set(f.id, f.pinyin);
    }
    return map;
  }, [finals]);

  // ─── Cell tap → detail panel ───

  const handleCellClick = useCallback(
    (e: React.MouseEvent, initialId: string, finalId: string) => {
      // Ignore if dragging
      if (isDragging.current) return;

      const key = `${initialId}:${finalId}`;
      const tones = comboMap.get(key);
      if (!tones) return;
      const validTones = tones.filter((t): t is string => t !== null);
      if (validTones.length === 0) return;

      const initialPinyin = initialMap.get(initialId) ?? initialId;
      const finalPinyin = finalMap.get(finalId) ?? finalId;

      setSelected({ initial: initialPinyin, final: finalPinyin, tones: validTones });
    },
    [comboMap, initialMap, finalMap, isDragging],
  );

  const handleDeselect = useCallback(() => {
    setSelected(null);
  }, []);

  // ─── Grid cell rendering ───

  const gridCols = `60px repeat(${finals.length}, 60px)`;

  // Track which cell is selected for highlighting
  const selectedKey = selected ? `${selected.initial}:${selected.final}` : null;

  // Build grid data for virtualized rendering
  // We render all rows but limit visible cols for performance
  const gridCells = useMemo(() => {
    const cells: React.ReactNode[] = [];

    // Spacer for corner position (consumes grid column 1, row 1)
    cells.push(
      <div key="corner-spacer" className="sliding-pinyin-grid__corner-spacer top-0 left-0">
        <span className="sliding-pinyin-grid__corner-fin absolute text-muted lh-1 fw-600">
          Final
        </span>
        <span className="sliding-pinyin-grid__corner-init absolute text-muted lh-1 fw-600">
          Initial
        </span>
      </div>,
    );

    // Column headers (finals)
    for (let fi = 0; fi < finals.length; fi++) {
      const f = finals[fi];
      cells.push(
        <div
          key={`col-hdr-${f.id}`}
          className="sliding-pinyin-grid__col-header flex-center p-xs bg-surface-dark-alt-2 top-0"
          title={f.description}
        >
          <div className="sliding-pinyin-grid__header-content flex-center w-full">
            <span className="font-sm fw-600 text-secondary lh-tight">{f.pinyin}</span>
            {f.type && <span className="font-xs text-muted lh-1 fw-500">{f.type.slice(0, 1)}</span>}
          </div>
        </div>,
      );
    }

    // Row headers + data cells
    for (let ri = 0; ri < initials.length; ri++) {
      const init = initials[ri];
      // Row header
      cells.push(
        <div
          key={`row-hdr-${init.id}`}
          className="sliding-pinyin-grid__row-header flex-center p-xs bg-surface-dark-alt-2 left-0"
          title={`${init.pinyin} [${init.ipa ?? ""}] - ${init.description}`}
        >
          <div className="sliding-pinyin-grid__header-content flex-center w-full">
            <span className="font-sm fw-600 text-secondary lh-tight">{init.pinyin}</span>
            {init.ipa && <span className="font-xs text-muted lh-1 fw-500">{init.ipa}</span>}
          </div>
        </div>,
      );

      // Data cells for this initial
      for (let fi = 0; fi < finals.length; fi++) {
        const fin = finals[fi];
        const key = `${init.id}:${fin.id}`;
        const tones = comboMap.get(key);
        const firstTone = tones?.[0] ?? null;
        const isSelected = selectedKey === key;

        cells.push(
          <div
            key={`cell-${key}`}
            className={`sliding-pinyin-grid__cell flex-center p-xs bg-surface-dark transition-colors ${firstTone ? "" : "sliding-pinyin-grid__cell--empty bg-surface-dark-alt"} ${isSelected ? "sliding-pinyin-grid__cell--selected bg-primary-bg relative" : ""}`}
            onClick={(e) => firstTone && handleCellClick(e, init.id, fin.id)}
            title={
              firstTone
                ? `${init.pinyin} + ${fin.pinyin} — ${tones?.filter(Boolean).join(", ") ?? ""}`
                : `${init.pinyin} + ${fin.pinyin} — no valid combination`
            }
            role="button"
            tabIndex={firstTone ? 0 : undefined}
            aria-label={
              firstTone
                ? `${init.pinyin} + ${fin.pinyin}: ${tones?.filter(Boolean).join(", ")}`
                : `${init.pinyin} + ${fin.pinyin}: no combination`
            }
            onKeyDown={(e) => {
              if (firstTone && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                handleCellClick(e as unknown as React.MouseEvent, init.id, fin.id);
              }
            }}
          >
            {firstTone ? (
              <span
                className="font-sm fw-500"
                style={{ color: TONE_COLORS[extractToneNumber(firstTone)] ?? TONE_COLORS[0] }}
              >
                {/* inline: dynamic tone color — depends on cell data */}
                {stripToneAndDigits(firstTone)}
              </span>
            ) : (
              <span className="font-xs text-muted">&mdash;</span>
            )}
          </div>,
        );
      }
    }

    return cells;
  }, [initials, finals, comboMap, handleCellClick, selectedKey]);

  // ─── Render ───

  return (
    <div className="sliding-pinyin-grid__area flex w-full gap-md">
      <Box
        ref={containerRef}
        variant="dark"
        padding="xs"
        className="sliding-pinyin-grid__container relative w-full overflow-hidden flex-1"
      >
        <div
          ref={scrollRef}
          className="sliding-pinyin-grid__scroll w-full h-full"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="sliding-pinyin-grid grid gap-xs"
            style={{
              gridTemplateColumns: gridCols,
              gridTemplateRows: `40px repeat(${initials.length}, 40px)`,
            }}
          >
            {gridCells}
          </div>
        </div>
      </Box>

      {/* Detail panel */}
      {selected && (
        <DetailPanel
          key={`${selected.initial}:${selected.final}`}
          initial={selected.initial}
          final={selected.final}
          tones={selected.tones}
          charMap={charMap}

          onClose={handleDeselect}
        />
      )}
    </div>
  );
}

export const SlidingPinyinGrid = React.memo(SlidingPinyinGridComponent);
