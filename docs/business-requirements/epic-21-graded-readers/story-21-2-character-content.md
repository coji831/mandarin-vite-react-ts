# Story 21.2: Character Content Generation

**Last Update:** July 27, 2026

## Description

**As a** learner,
**I want to** characters to be enriched with decomposition data, phonetic component analysis, classification (pictograph/phono-semantic), and coverage milestones,
**So that** the reading experience includes rich character-level context.

## Business Value

Character enrichment is the second critical prerequisite for the epic — without it, the reading UI cannot display frequency badges, HSK pills, phonetic decomposition layouts, or DB-driven phonetic clusters. This story imports Make Me a Hanzi decomposition data, infers phonetic components, populates character classification and `CharacterRadical.decompositionType`, and generates the pinyin→character reverse index. It unlocks the character-level context that makes the reading experience pedagogically valuable.

> **Scope note:** Story 21.1's 3-phase pipeline (generate → enrich → seed) already delivered **10 of 13 original ACs**. This story focuses on the remaining items: Component scaffold seeding, CharacterComponent decomposition seeding, and pipeline verification via two new enrich scripts.

## Acceptance Criteria

> ✅ = Delivered by Story 21.1 (3-phase pipeline). ❌ = Remaining for this story.

- [x] CharacterComponent model created with `characterId`, `componentId`, `position`, and `function` fields
- [x] Component model created with `id`, `glyph`, `meaning`, `type`, `variantOf`, `strokes` fields
- [x] Character.`classification` populated for all characters: "pictograph" | "ideograph" | "phono_semantic" | "compound_ideograph" | null
- [x] Character.`phoneticComponentId` populated for phono-semantic characters, referencing the phonetic component Character ID
- [x] CharacterRadical.`decompositionType` populated for all characters: "semantic" | "phonetic" | "remaining" | null
- [x] PinyinCharacterMapping table populated for all characters, creating a reverse index from pinyin syllable → character
- [x] PinyinSyllable table verified with ≥1,300 entries (actual: 2,045)
- [x] Content files regenerated: `content/characters/characters.json` includes classification and phoneticComponentId
- [x] Seed script is idempotent (safe to re-run — uses `skipDuplicates: true`)
- [x] Character coverage milestone verified: 500+ characters with classification populated
- [ ] **Component scaffold seeded** — `content/seed/phase2/component-entries.json` populated via `build-component-entries.ts`
- [ ] **CharacterComponent decomposition seeded** — `content/seed/phase2/character-components.json` populated via `build-character-components.ts`
- [ ] **Pipeline verified** — Both new enrich scripts integrated into `script:enrich-all` → `db:seed` and verified end-to-end

## Business Rules

1. **3-Phase Pipeline** — Data flows through three phases:
   - **Phase 1 (Generate):** Raw JSON extraction from source datasets (MMAH, Unihan, CC-CEDICT, HSK)
   - **Phase 2 (Enrich):** Per-table JSON transforms that merge, map, and resolve cross-references
   - **Phase 3 (Seed):** Bulk-insert Phase 2 JSON files into the database via `prisma/seed.ts`
2. **Make Me a Hanzi as decomposition source** — Import structural decomposition data from the Make Me a Hanzi dataset. Each character's component breakdown is stored in the CharacterComponent model.
3. **Classification from MMAH etymology type** — Characters classified using MMAH's `etymology.type` field mapped via `CLASSIFICATION_MAP`: `pictographic` → `pictograph`, `pictophonetic` → `phono_semantic`, `ideographic` → `ideograph`. Compounds without a direct MMAH type remain `null`.
4. **Phonetic component via MMAH etymology.phonetic** — The `phoneticComponentId` is resolved from MMAH's `etymology.phonetic` glyph field (e.g., "从"), then mapped to a `ch_XXXX` character ID via the glyph-to-ID index. No heuristic pinyin matching needed.
5. **Decomposition type on CharacterRadical** — Each radical link gets a `decompositionType`: `"semantic"` (meaning-related), `"phonetic"` (sound-related), `"remaining"` (leftover stroke), or `null` (unknown). Inferred from MMAH `etymology.type` — phono-semantic characters tag the radical as `"semantic"`; others default to `null`.
6. **Pinyin→character reverse index** — PinyinCharacterMapping enables queries like "find all characters pronounced 'shi'". Used by phonetic clusters and future search features.
7. **Component-Kangxi deduplication** — New Component entries must be cross-referenced against existing Kangxi radical data to avoid duplicates.
8. **Idempotent seeding** — All seed operations use `skipDuplicates: true` or pre-clear patterns. Safe to re-run without duplicates.

## Related Issues

- Epic 21: Graded Readers — BR (`../README.md`) (epic parent)
- **Story 21.1: Data Lifecycle** ([BR](story-21-1-data-lifecycle.md)) — Delivered the `CharacterComponent` + `Component` schema models, the 3-phase pipeline infrastructure, and populated ~8 of this story's original ACs (classification, phoneticComponentId, decompositionType, PinyinCharacterMapping, PinyinSyllable, content regeneration, seed idempotency, coverage milestone)

## Implementation Status

- **Status**: In Progress
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: TBD
