---
purpose: Design doc for the Phase-1 foundations learning path — the Blueprint wizard plus the pinyin/tones/strokes/animations/pictographs reference index
status: active
last-verified: 2026-10-30
type: design
---

# Foundations Feature Design

**Last Updated:** 2026-10-30

## Overview

The Foundations feature provides the Phase 1 character foundations learning path — the first content area users encounter. It covers Pinyin initials/finals, tones, stroke order, and character animations.

## Two surfaces, one subject

| Surface           | Route                          | Archetype / mode   | What it is                                                                     |
| ----------------- | ------------------------------ | ------------------ | ------------------------------------------------------------------------------ |
| The **Blueprint** | `/learn/foundations`           | `wizard` / Focus   | Week 1 as ONE sequential task: 7 steps, one per screen, one primary `Continue` |
| The **Reference** | `/learn/foundations/reference` | `reports` / Browse | The dense 409-cell index (`?tab=`): every initial, final, tone pair and stroke |

The two link to each other: the Blueprint's wayfinding block offers `Reference` on every
step, and the reference's header offers `Blueprint` back. Neither is a dead end.

## Blueprint entry model (the walk is a guide, not a treadmill)

The original §3 rework removed the reference _from_ the task, and in doing so removed the only
remembered state: the step index lived in component state, so every mount restarted at step 1,
and the stepper refused every step ahead of the current one. A returning learner had to press
`Continue` six times to reach "radicals", and nothing recorded that they had ever finished.

| Question                 | Answer                                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Where does it open?      | `?step=<stepId>` → the stored cursor → step 1. A bare route resumes; it never resets.                        |
| How do I reach a step?   | Any stepper item (all operable, forward included), `Continue`/`Back`, or a `?step=` deep link.               |
| What persists?           | `foundations:blueprintPosition` in `localStorage` — `{ lastStepId, completedAt }`, one device-local key.     |
| What does completion do? | Changes the eyebrow (`· Blueprint complete`) and the last-step CTA (`Open the reference`). It gates NOTHING. |
| Ownership                | `hooks/useBlueprintPosition.ts` — read/write/clear helpers plus the `useBlueprintPosition` hook.             |

Why one device-local key rather than an identity-scoped cache (contrast `phaseGate:*`): the
record is a cursor and a timestamp — no user data, no score — so a second person on the same
device inherits a position, not an achievement, and BM-1 already lets any visitor skip the walk.

**No content wall.** Nothing is disabled, dimmed, or redirected: BM-1 L2/L6 make phase and step
order sequencing metadata, so every step and every reference tab is reachable by every visitor,
guest included. Ordering is a suggestion offered by the primary CTA.

### Known follow-up (not implemented here — touches shared chrome)

`/learn/foundations` and `/learn/foundations/reference` are reachable from each other and from
`Continue`, but the Learn rail has no `Reference` child: `learnNav.LEARN_NAV_ITEMS` lists six
destinations and `SideNav` renders them flat, so a "reference" entry needs (a) an `exact` flag on
`LearnNavItem` — without it the `Foundations` child would also read as current on
`/learn/foundations/reference` — and (b) updates to the `name: /Foundations/` queries in
`SideNav.test.tsx`. That is a nav-model change, deliberately left out of this pass.

## Reference tab structure

The five siblings live on `FoundationsReferencePage.tsx`, not on the Blueprint page:

| Tab         | Component                | Data Source                                                                            | Description                                                                   |
| ----------- | ------------------------ | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Pinyin      | `PinyinTab.tsx`          | Pool API + local utils                                                                 | Initials grid, finals grid, combination explorer                              |
| Tones       | `TonesTab.tsx`           | Pool API                                                                               | Tone contours, pair drills, tone change rules + **SandhiDrill** (Story 21.17) |
| Strokes     | `StrokeReferenceTab.tsx` | DB via `foundationsService.getStrokesReference()` → `GET /v1/foundations/data/strokes` | Basic strokes, rules, character breakdown                                     |
| Animations  | `StrokeAnimationTab.tsx` | Local JSON + hanzi-writer                                                              | Stroke order animations, character search                                     |
| Pictographs | `PictographGallery.tsx`  | Local service (`pictographGalleryService`)                                             | Oracle-bone evolution cards + Pictograph Match mini-game (Story 21.21)        |

No tab is locked (`?tab=` is URL-driven; phase is progress metadata, never permission).

## Key Files

| File                                                   | Purpose                                                      |
| ------------------------------------------------------ | ------------------------------------------------------------ |
| `pages/learn/foundations/FoundationsPage.tsx`          | The Blueprint — step position, resume, completion (page)     |
| `pages/learn/foundations/FoundationsReferencePage.tsx` | The reference index — `?tab=` driven, links to the Blueprint |
| `components/blueprint/`                                | Step registry, step body switch, stepper (jump menu)         |
| `hooks/useBlueprintPosition.ts`                        | Persisted step cursor + completion signal                    |
| `pages/learn/foundations/PinyinTab.tsx`                | Pinyin reference tab                                         |
| `pages/learn/foundations/TonesTab.tsx`                 | Tones reference tab                                          |
| `components/pinyin/`                                   | Pinyin grid/cell components                                  |
| `components/tones/`                                    | Tone card/drill/rule components                              |
| `components/strokes/`                                  | Stroke order components                                      |
| `components/animations/`                               | Hanzi writer animation components                            |
| `components/pinyin/SlidingPinyinGrid.tsx`              | Sliding pinyin grid with drag-to-pan interaction             |
| `components/pinyin/DetailPanel.tsx`                    | Pinyin detail panel with character info                      |
| `hooks/useDragToPan.ts`                                | Touch/drag panning hook for pinyin grid                      |
| `hooks/useFoundationsProgress.ts`                      | Progress tracking (reference sections)                       |
| `services/foundationsService.ts`                       | API calls for pool + progress                                |
| `types/pool.ts`                                        | Type definitions matching `pinyin-tones-pool.json`           |
| `utils/pinyinUtils.ts`                                 | Tone color mapping, combination lookup, tone helpers         |

## Data Flow

```
Backend API (/v1/foundations/data/pinyin-tones)
  → foundationsService.getPinyinTonesPool()
  → useBlueprintContent (Blueprint steps) | useFoundationsProgress (reference sections)
  → Step body / tab components render data
```

Access: both routes are **not** phase-gated — no route gate wraps them and neither reads a phase
(`LearnRoutes.tsx` renders them for every visitor, guests included).

## Dependencies

- `@mandarin/shared-constants` — `FOUNDATION_SECTIONS`, `ROUTE_PATTERNS`
- `@mandarin/shared-types` — `FoundationProgress`, `PhaseGate`
- `services` alias (`axiosClient`)
