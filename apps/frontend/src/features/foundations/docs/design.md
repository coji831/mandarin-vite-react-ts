# Foundations Feature Design

**Last Updated:** June 22, 2026

## Overview

The Foundations feature provides the Phase 1 character foundations learning path — the first content area users encounter. It covers Pinyin initials/finals, tones, stroke order, and character animations.

## Tab Structure

The feature is rendered via `FoundationsPage.tsx` with 4 tabs:

| Tab | Component | Data Source | Description |
|-----|-----------|-------------|-------------|
| Pinyin | `PinyinTab.tsx` | Pool API + local utils | Initials grid, finals grid, combination explorer |
| Tones | `TonesTab.tsx` | Pool API | Tone contours, pair drills, tone change rules |
| Strokes | `StrokeReferenceTab.tsx` | Local JSON | Basic strokes, rules, character breakdown |
| Animations | `AnimationTab.tsx` | Local JSON + hanzi-writer | Stroke order animations, character search |

## Key Files

| File | Purpose |
|------|---------|
| `FoundationsPage.tsx` | Tab orchestrator (page-level, in `pages/learn/`) |
| `PinyinTab.tsx` | Pinyin reference tab |
| `TonesTab.tsx` | Tones reference tab |
| `components/pinyin/` | Pinyin grid/cell components |
| `components/tones/` | Tone card/drill/rule components |
| `components/strokes/` | Stroke order components |
| `components/animations/` | Hanzi writer animation components |
| `hooks/useFoundationsProgress.ts` | Progress tracking |
| `services/foundationsService.ts` | API calls for pool + progress |
| `types/pool.ts` | Type definitions matching `pinyin-tones-pool.json` |
| `utils/pinyinUtils.ts` | Tone color mapping, combination lookup, tone helpers |

## Data Flow

```
Backend API (/v1/foundations/data/pinyin-tones)
  → foundationsService.getPinyinTonesPool()
  → useFoundationsProgress (progress state)
  → Tab components render data
```

Phase gating is handled by `LearnRoutes.tsx` and `usePhaseGate`.

## Dependencies

- `@mandarin/shared-constants` — `FOUNDATION_SECTIONS`, `ROUTE_PATTERNS`
- `@mandarin/shared-types` — `FoundationProgress`, `PhaseGate`
- `services` alias (`axiosClient`)
