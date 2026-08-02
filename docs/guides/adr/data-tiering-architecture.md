# ADR-006: Data Tiering Architecture

**Status:** Proposed
**Date:** 2026-07-23
**Deciders:** Architecture Team

---

## Context

The Graded Readers feature (Epic 21) exposed a fundamental weakness in the data lifecycle: the codebase grew to ~11K word records, with content data, relationship data, and user tracking data all mixed in the same storage and update patterns. Several pain points emerged:

1. **Blind spot**: The original design generated 11K individual `content/words/w_XXXXX.json` files before Story 21.1 consolidated them into 2 aggregate files. No tier-aware strategy existed for what belonged in content files vs. DB vs. both.
2. **No lifecycle clarity**: Content entities (characters, radicals), relationship entities (WordCharacter, CharacterHskLevel), and event entities (ReviewLog, WordLookupEvent) were all treated the same way.
3. **Cache ambiguity**: The existing caching strategy defined TTLs per resource but had no tier-based rationale for _why_ one entity gets a 1-hour TTL and another gets 5 minutes.
4. **Deployment coupling**: Content changes trigger the same deployment pipeline as user-data schema changes, even though their risk profiles and frequencies differ by orders of magnitude.
5. **Module dependency risk**: No rules existed about which modules could depend on which data tiers.

## Decision

Define **4 data tiers** with clear criteria, storage rules, cache policies, update mechanisms, and module dependency constraints.

### Tier 1: Static Reference

**Criteria:** Data that is foundational, never changes after authoring, and has zero user-specific attributes.

| Entity                                                | Rationale                                   |
| ----------------------------------------------------- | ------------------------------------------- |
| Foundations (pinyin initials, finals, tones, strokes) | Published once, immutable. ~50 files total. |
| Radicals (Kangxi radical list)                        | Near-immutable. ~20 entries.                |

**Storage:**

- Primary: `content/*.json` static files (version-controlled in Git)
- DB mirror: `ContentItem` table (for unified content indexing), `PinyinCombination` (for querying pinyin)
- No per-user storage

**Cache:**

- In-memory at server startup (loaded once, never evicted)
- No Redis needed
- Strategy: preload on bootstrap, immutable for process lifetime

**Update:**

- Via Git deployment (content file changes)
- Server restart required to pick up changes
- Estimated change rate: < 1/year

**Backup:** Git history (source of truth is content files)

**Dependency rule:** Zero dependencies — this tier imports nothing from higher tiers.

---

### Tier 2: Master Data

**Criteria:** Core business entities with stable identity, cross-entity relationships, and enrichment data that changes infrequently (< 5/year).

| Entity            | Rationale                                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Characters        | Stable CJK set (~2700 unique). Has enrichment (readings, etymology, stroke data) and relationships (to radicals, words). |
| CharacterReadings | Derived from character content files. Stable per-character.                                                              |
| CharacterHskLevel | Aggregate — minimum HSK level across all words containing the character. Recalculated when word set changes.             |
| CharacterRadical  | Junction — character ↔ radical mappings.                                                                                 |

**Storage (DB for crucial, aggregate JSON for enrichment):**

- **DB (crucial — indexed, queried, relational):** `Character` table (id, glyph, strokeCount), `CharacterReading` (pinyin, tone, type), `CharacterHskLevel`, `CharacterRadical`
- **JSON aggregate (enrichment — loaded on detail pages):** Single `content/characters/characters.json` file with traditional, definition, etymology, frequencyRank, commonWords, radicalIds
- DB is the query source of truth. The JSON aggregate is a content cache for enrichment data that doesn't need indexing.

**Cache:**

- In-memory + Redis, TTL 1 hour
- Strategy: cache-aside with fail-open
- Stampede prevention: use Redis SETNX for cold-start loads

**Update:**

- Seed scripts populate DB from CSV/external sources
- Manual enrichment (etymology, definitions) via content file edits + re-seed
- Estimated change rate: < 5/year

**Backup:** Git (content files) + periodic DB dump

**Dependency rule:** May import from Tier 1. May NOT import from Tier 3 or Tier 4.

---

### Tier 3: Produced Content

**Criteria:** Volumetric data that is generated or produced (seeded, AI-generated, derived), has relationships to master entities, and changes on a monthly/on-demand cadence.

| Entity            | Rationale                                                                  |
| ----------------- | -------------------------------------------------------------------------- |
| Words             | ~11K records seeded from CSV. Bulk-loaded, infrequently updated.           |
| WordCharacter     | Junction — the word-character relationship. Changes when word set changes. |
| WordHskLevel      | HSK classification per word. Derived from CSV.                             |
| Passages          | AI-generated reading content. Produced on-demand.                          |
| Phonetic Clusters | Derived from character readings at query time. Computable, not stored.     |

**Storage:**

- Words: DB (`Word`, `WordCharacter`, `WordHskLevel`) + aggregate content files (`content/words/index.json`, `content/words/words.json`)
- Passages: DB only (`Passage` table with JSON content column)
- Phonetic Clusters: computed at query time (no persistent storage)
- Aggregate content files are regeneration caches — source of truth is the DB

**Cache:**

- Redis, TTL 5-30 minutes
- Words: 30-minute TTL (bulk data, stable)
- Passages: 30-minute TTL (AI-generated, cached after first access)
- Phonetic clusters: session-level or no cache (computed cheaply)

**Update:**

- Words: seed scripts from `data/HSK-3.0-Word-List.csv`
- Passages: Gemini AI generation API + cache
- Phonetic Clusters: computed on read
- Estimated change rate: monthly/on-demand

**Backup:** DB dump. Aggregate content files are regenerable.

**Dependency rule:** May import from Tier 1 and Tier 2. May NOT import from Tier 4.

---

### Tier 4: Transaction / Event Data

**Criteria:** Per-user, append-mostly data generated by every user action. High write volume. Tracks behavior, progress, and state.

| Entity            | Rationale                                                        |
| ----------------- | ---------------------------------------------------------------- |
| CharacterProgress | Per-user SRS state for characters. Updated every review session. |
| ReviewLog         | Append-only event log for all review events.                     |
| WordLookupEvent   | Per-tap tracking of word lookups. Append-only.                   |
| ReadingSession    | Per-passage user progress. Updated on every read.                |
| Bookmark          | Saved passages. CRUD but low volume.                             |
| WordStudyContext  | Records which words a user studied in a character context.       |

**Storage:**

- DB only (no content files)
- ReviewLog and WordLookupEvent are append-only event streams
- CharacterProgress and ReadingSession are mutable state (CRUD)
- Bookmark is simple CRUD

**Cache:**

- None for event streams (ReviewLog, WordLookupEvent)
- Very short TTL (< 1 minute) for mutable state (CharacterProgress, ReadingSession)
- Strategy: cache-aside with fail-open, but prefer bypassing cache for writes

**Update:**

- Every user action: quiz completion, word tap, passage read, bookmark save
- Append-only for events; upsert for progress state
- Estimated change rate: every user session, per-action

**Backup:** DB dump + event replay (append-only streams enable reconstruction of derived state)

**Dependency rule:** May import from all lower tiers (Tiers 1-3). Must NOT be imported by any lower tier.

---

## Rationale

### Why 4 tiers?

The industry-standard reference/master/transaction data taxonomy (DAMA-DMBOK) divides data into:

- **Reference data** — classification/static lookup (our Tier 1)
- **Master data** — core business entities (our Tier 2)
- **Transaction data** — records of business events (our Tier 4)

We add **Tier 3 (Produced Content)** because words and passages have a distinct lifecycle:

- They are bulk-loaded or generated, not manually authored
- They exist in large volumes (11K words) unlike curated master data
- Their change rate is higher than master data but lower than transaction data
- They serve as the bridge between reference/master data and user-facing features

### Why characters are Tier 2, not Tier 1

Characters are defined by the CJK unified ideographs standard (stable, like Tier 1), but they **have relationships** (to words, radicals) and enrichment data (readings, etymology) that can change. Characters participate as the foreign key target of `CharacterProgress` (Tier 4), `WordCharacter` (Tier 3), and `CharacterRadical` (junction across tiers). A Tier 1 entity by definition has no relationships and no update mechanism — characters have both.

### Why Phonetic Clusters are not stored

Phonetic clusters are computable from `CharacterReading.pinyin` + `CharacterReading.tone`. They're a query-time aggregation, not a storage concern. Computing them on read is O(n) over the character set (~2700), which is trivially fast. Storing them separately creates a consistency problem (what happens when a reading changes?) with no read performance benefit.

### Why Event Sourcing for Tier 4

The tracking tier follows CQRS principles from the [Azure Architecture Center](https://learn.microsoft.com/en-us/azure/architecture/patterns/event-sourcing): ReviewLog and WordLookupEvent are append-only event streams (the event store), while CharacterProgress and ReadingSession are materialized views derived from those events. This enables:

- **Audit trail**: every review action is replayable
- **Correctness**: CharacterProgress can be rebuilt from ReviewLog if corrupted
- **Analytics**: event streams power "what did the user do?" queries without coupling to mutable state

### Reference Data Management (DAMA-DMBOK)

Per the Data Management Body of Knowledge, reference data best practices include:

1. Formalize the reference data management — done via ADR
2. Use external reference data as much as possible — HSK 3.0 CSV from andycburke
3. Version control your reference data — content files in Git, manifest.json has `version` field

---

## Consequences

### Module Dependency Hierarchy

```
Tier 1 (Static Reference)  ──→  nothing
Tier 2 (Master Data)       ──→  Tier 1
Tier 3 (Produced Content)  ──→  Tier 1, Tier 2
Tier 4 (Transaction Data)  ──→  Tier 1, Tier 2, Tier 3
```

Enforcement: backend modules must only import from their own tier or lower tiers. A review module (Tier 4) can import Character (Tier 2). A character module (Tier 2) must NOT import ReviewLog (Tier 4).

### Cache Strategy

| Tier                  | Cache Layer              | TTL        | Eviction       |
| --------------------- | ------------------------ | ---------- | -------------- |
| 1 — Static Reference  | In-memory (process heap) | Never      | Manual restart |
| 2 — Master Data       | In-memory + Redis        | 1 hour     | TTL expiry     |
| 3 — Produced Content  | Redis                    | 5-30 min   | TTL expiry     |
| 4 — Transaction/Event | None or < 1 min          | Very short | N/A            |

All tiers follow the existing **fail-open** pattern: Redis failures return `null`, treated as cache miss.

### Deployment Cycles

| Tier                  | Trigger                                     | Risk     | Frequency         |
| --------------------- | ------------------------------------------- | -------- | ----------------- |
| 1 — Static Reference  | Content file change + Git push + restart    | Very low | < 1/year          |
| 2 — Master Data       | Content file edit + re-seed                 | Low      | < 5/year          |
| 3 — Produced Content  | CSV update + re-seed, or Gemini passage gen | Medium   | Monthly/on-demand |
| 4 — Transaction/Event | Schema migration (Phase A/B/C)              | High     | Per story/epic    |

### Phase Mapping

| Phase        | Tiers Affected                    | Scope                                                                                                                                         |
| ------------ | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Phase A (✅) | Tiers 2-4 (new models additive)   | Word, Character extensions, WordCharacter, CharacterReading, CharacterProgress, ReviewLog, WordLookupEvent, Passage, ReadingSession, Bookmark |
| Phase B      | Tiers 2-3 (migrate existing data) | migrate-progress.ts, normalize-character-ids.ts                                                                                               |
| Phase C      | Tiers 2-4 (cleanup deprecated)    | Drop old tables, remove deprecated fields                                                                                                     |

### Storage Decision Table

| Entity            | Tier | Storage Location                                                                                   | Cache                     | Update                         | Change Rate |
| ----------------- | ---- | -------------------------------------------------------------------------------------------------- | ------------------------- | ------------------------------ | ----------- |
| Pinyin Initials   | 1    | `content/pinyin/init_*.json` + `PinyinCombination` DB                                              | In-memory (never evict)   | Content file edit + re-seed    | < 1/year    |
| Pinyin Finals     | 1    | `content/pinyin/fin_*.json` + `PinyinCombination` DB                                               | In-memory (never evict)   | Content file edit + re-seed    | < 1/year    |
| Tones             | 1    | `content/tones/*.json`                                                                             | In-memory (never evict)   | Content file edit              | < 1/year    |
| Strokes           | 1    | `content/characters/*.json` (stroke data)                                                          | In-memory (never evict)   | Content file edit              | < 1/year    |
| Radicals          | 1    | `content/radicals/rad_*.json` + `ContentItem` DB                                                   | In-memory (never evict)   | Content file edit + re-seed    | < 1/year    |
| Characters        | 2    | DB (`Character` table: id, glyph, strokeCount) + `content/characters/characters.json` (enrichment) | In-memory + Redis, TTL 1h | Content file edit + re-seed    | < 5/year    |
| CharacterReadings | 2    | DB (`CharacterReading` table)                                                                      | In-memory + Redis, TTL 1h | Re-seed from content files     | < 5/year    |
| CharacterHskLevel | 2    | DB (`CharacterHskLevel` table)                                                                     | In-memory + Redis, TTL 1h | Recalculated on word re-seed   | < 5/year    |
| CharacterRadical  | 2    | DB (`CharacterRadical` junction)                                                                   | In-memory + Redis, TTL 1h | Content file edit + re-seed    | < 5/year    |
| Words             | 3    | DB (`Word` table) + `content/words/index.json`, `words.json`                                       | Redis, TTL 30 min         | Seed from CSV                  | Monthly     |
| WordCharacter     | 3    | DB (`WordCharacter` junction)                                                                      | Redis, TTL 30 min         | Seed from CSV                  | Monthly     |
| WordHskLevel      | 3    | DB (`WordHskLevel` table)                                                                          | Redis, TTL 30 min         | Seed from CSV                  | Monthly     |
| Passages          | 3    | DB (`Passage` table)                                                                               | Redis, TTL 30 min         | Gemini AI generation           | On-demand   |
| Phonetic Clusters | 3    | None (computed at query time)                                                                      | Session-level or none     | Derived from CharacterReadings | N/A         |
| CharacterProgress | 4    | DB (`CharacterProgress`)                                                                           | < 1 min or none           | Every review action (upsert)   | Per session |
| ReviewLog         | 4    | DB (`ReviewLog`, append-only)                                                                      | None                      | Every review action (insert)   | Per session |
| WordLookupEvent   | 4    | DB (`WordLookupEvent`, append-only)                                                                | None                      | Per word tap (insert)          | Per session |
| ReadingSession    | 4    | DB (`ReadingSession`)                                                                              | < 1 min or none           | Per passage read (upsert)      | Per session |
| Bookmark          | 4    | DB (`Bookmark`)                                                                                    | None or < 1 min           | User action (CRUD)             | Per session |
| WordStudyContext  | 4    | DB (`WordStudyContext`)                                                                            | None                      | Per char→word study (insert)   | Per session |

---

## Compliance

1. **All new entities** in future epics MUST be assigned to one of the 4 tiers before implementation, documented in the epic's Architecture Decisions section.

2. **Module dependency review** — during code review, verify that no module imports from a higher tier than its own entities.

3. **Cache configuration** — new entity cache TTLs must be justified by their tier. Deviations require written rationale.

4. **Content file vs. DB decisions** — new entities must decide: is the content file the source of truth (Tiers 1-2) or the DB (Tiers 3-4)? Dual storage is permitted only for Tiers 1-2.

5. **Event stream integrity** — Tier 4 append-only tables (ReviewLog, WordLookupEvent) must never have UPDATE or DELETE operations on existing rows.

---

_Based on industry research: DAMA-DMBOK (Data Management Body of Knowledge), Azure Architecture Center (CQRS, Event Sourcing, Materialized View patterns), reference data management best practices, and Chinese language learning app architecture patterns._
