---
purpose: Shared data model across packages
status: active
last-verified: 2026-08-16
type: guide
---

# Shared Data Model

**Category:** Data Architecture
**Last Updated:** August 16, 2026
**Difficulty:** Intermediate

> **History:** This article was originally developed as a gitignored working spec that is NOT
> official documentation and may be deleted; do not treat it as authoritative. It is now the
> committed source of record for the shared data model, alongside the all-in-DB architecture
> described in `docs/architecture.md`.

---

## Problem

The learning platform spans many content epics (foundations, radicals, characters, words,
mnemonics, graded readers, grammar, idioms). Without a shared data model, each feature would
invent its own entity shapes, junction tables, and progress-tracking conventions — causing
schema drift and duplicated ingestion logic.

## Root Cause

Content and user data were historically split across aggregate JSON files and database tables
with no single reference describing the entities, relations, and progress-tracking
architecture. Feature teams would interpret the same concept (e.g., "a radical") differently.

## Solution

### Content entities

| Entity               | Purpose                                                                                  | Notes                                       |
| -------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------- |
| `Character`          | A CJK glyph with readings, classification, etymology                                     | ≥2,971 seeded; enriched fields              |
| `Word`               | Vocabulary entry (simplified, pinyin, meaning, hskLevel, wordClass)                      | All-in-DB; content/ files are seed source   |
| `Radical`            | Kangxi radical entity                                                                    | 20 seeded                                   |
| `Component`          | Reusable sub-character component (semantic or phonetic)                                  | `cmp_XXXX` ids                              |
| `CharacterComponent` | Character ↔ Component decomposition junction (position, function)                        | e.g., 河 → 氵 (left) + 可 (right, phonetic) |
| `PinyinSyllable`     | Syllable reference data                                                                  | 2,045 seeded                                |
| `MeasureWord`        | Measure word entity (量词) with permanent `mw_XXXXX` ids                                 | ≥50 seeded                                  |
| `Passage`            | Graded reader passage (plain text + cached segmentation)                                 | Story 21.3                                  |
| `GrammarPattern`     | Grammar pattern with structure, usage rules, and curated examples                        | `gr_XXXX` ids; 21 KB-sourced patterns       |
| `Chengyu`            | 4-character idiom with narrative origin story, theme/era tags, and modern-usage examples | `cy_XXXX` ids; 50+ idioms (Epic 23)         |

### Junction tables

Relations are stored as DB junction tables, not embedded JSON:

`WordCharacter`, `CharacterRadical`, `CharacterReading`, `CharacterComponent`,
`MeasureWordWord` (measure word ↔ noun with `isDefault`), `WordHskLevel`,
`CharacterHskLevel`, `PinyinCharacterMapping`.

### Progress & tracking entities

- `ReviewLog` — append-only event stream; every progress update appends an event.
- `CharacterProgress` — per-glyph SRS state derived from ReviewLog events.
- `RadicalProgress` — per-radical memorized/recognition state (`@@unique([userId, radicalId])`).
- `WordStudyContext` — polyphone handling (character-level SRS with reading context).
- `ReadingSession` / `Bookmark` — graded-reader progress.
- `QuizAttempt` / `QuizAttemptAnswer` — phase-gate and drill assessments.
- `PhaseGate`, `FoundationProgress` — phase progression.

### Pre-adaptation fields

Content entities carry stable, pre-adapted fields (content ID, version, metadata) so seed
re-runs are idempotent and references never break — see
[Pre-Adaptation Rules](../backend/pre-adaptation-static-dynamic-separation.md).

## Impact

- **Single source of truth** for schema design, Prisma models, and ingestion pipelines.
- **Stable references** across epics — permanent content IDs survive seed re-runs.
- **All-in-DB reads** — production reads content via Prisma repositories; `content/` is the
  git-versioned seed source only (GCS for binary assets only).

## Alternatives Considered

- **4-tier aggregate JSON with runtime file reads** — superseded by the all-in-DB ADR
  (eliminates dual read paths, enables pgvector).
- **Per-feature ad-hoc schemas** — rejected; caused the drift this model prevents.

## See Also

- [Character-Level SRS with Reading Context](../backend/character-level-srs-reading-context.md)
- [Pre-Adaptation Rules](../backend/pre-adaptation-static-dynamic-separation.md)
- [Adult Mandarin Learning Roadmap](../learning-theory/adult-mandarin-learning-roadmap.md)
- `docs/architecture.md` (Content Data Flow) · `apps/backend/prisma/schema.prisma`
