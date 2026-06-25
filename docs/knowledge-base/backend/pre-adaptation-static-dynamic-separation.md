# Pre-Adaptation Rules for Static/Dynamic Data Separation

**Category:** Backend Development  
**Last Updated:** June 26, 2026

---

## Why

Language learning applications have large, complex static content (characters, words, radicals, grammar, chengyu) with many many-to-many relationships to dynamic user data (SRS progress, review history, quiz attempts). When static content evolves — typo fixes, definition improvements, stroke order corrections, or content expansions — the system is vulnerable to invalidating or corrupting user progress.

The long-term solution is a full Content Registry + Event Sourcing architecture. But that is a major investment. The **5 pre-adaptation rules** in this article cost almost nothing today but make the full migration trivial later. Teams should follow these rules whenever introducing new content entities or progress models.

---

## Use Case

Any developer adding a new content entity (radical, chengyu, grammar pattern, reader passage) or progress model to the database. Apply these rules at creation time — retrofitting existing entities is more expensive.

---

## Key Concepts

### The Core Distinction

```
CONTENT FILES (content/ — Git)        DATABASE TABLES (PostgreSQL)
┌──────────────────────────────┐      ┌───────────────────────────────┐
│ Entity ATTRIBUTES            │      │ Entity RELATIONSHIPS          │
│ What the thing IS            │      │ How things CONNECT            │
│ → glyph, pinyin, meaning     │      │ → M:N junction tables         │
│ → Immutable per version      │      │ → CharacterRadical,           │
│ → One file per entity        │      │   WordCharacter              │
└──────────────────────────────┘      │ → Queryable, indexable        │
                                      ├───────────────────────────────┤
                                      │ User DYNAMIC DATA             │
                                      │ → CharacterProgress, ReviewLog│
                                      │ → Event-sourced (future)      │
                                      └───────────────────────────────┘
```

**Content files** hold only what the entity _is_ — its intrinsic attributes.  
**Database tables** hold only how entities _connect_ — relationships between them — plus user dynamic data.

---

## The 5 Pre-Adaptation Rules

### Rule 1: Permanent Content IDs (Critical)

Every content entity gets a **stable, human-readable business key** assigned at creation — never an auto-increment integer. This key is what progress records and junction tables reference. It never changes for the entity's lifetime.

| Entity    | ID Pattern | Example              |
| --------- | ---------- | -------------------- |
| Character | `ch_XXXX`  | `ch_0342`, `ch_1001` |
| Radical   | `rad_XXXX` | `rad_0012`           |
| Word      | `w_XXXXX`  | `w_00001`            |
| Chengyu   | `cy_XXXX`  | `cy_0005`            |
| Grammar   | `gr_XXXX`  | `gr_0003`            |

**Implementation:** Every new Prisma content model gets:

```prisma
model Radical {
  id         String @id @default(uuid())   // Internal PK — never exposed
  content_id String @unique                // Stable business key: "rad_0012"
  // ... domain fields ...
}
```

Progress and junction tables reference `content_id`, not the auto-generated `id`.

**Why it matters:** If content IDs are stable, splitting 了 into two entries (le vs liǎo) becomes a soft deprecation — the old ID is marked `deprecated: true`, two new IDs are created, and progress records referencing the old ID are never orphaned.

### Rule 2: Content Version Field (Cheap Insurance)

Every content model gets a version counter:

```prisma
model Radical {
  content_version Int @default(1)
  // ↑ Bumped on every content update (typo fix, definition change)
}
```

**Why it matters:** When the full Content Registry is built, this version trail reconciles which content snapshot each user's progress references. Without it, determining whether a user's progress was based on old or new data requires manual inspection.

### Rule 3: JSON Metadata Field (Migration Shield)

Every content model gets an extensible metadata field:

```prisma
model Radical {
  metadata Json?  // frequencyRank, variants, examples[], etymology
}
```

**What goes in fixed columns vs metadata:**

| Fixed Column (schema-queryable) | JSON Metadata (extensible)             |
| ------------------------------- | -------------------------------------- |
| Fields used in WHERE filters    | Informational attributes               |
| Fields used in sort/order       | Rarely-accessed fields                 |
| Fields used in JOIN conditions  | Future/unstable attributes             |
| (e.g., glyph, pinyin, hskLevel) | (e.g., etymology notes, variant forms) |

**Why it matters:** Without `metadata`, each new attribute requires a Prisma migration. With `metadata`, new attributes go in the JSON. When the target architecture migrates to file-based content, the JSON maps directly.

### Rule 4: JSON File Per Entity — `content/` Directory

New static content is authored as individual JSON files, one per entity, under a `content/` directory at the repo root:

```
content/
├── manifest.json
├── characters/
│   ├── ch_0342.json       # One file per character
│   ├── ch_1001.json
│   └── ...
├── radicals/
│   ├── rad_0012.json      # One file per radical
│   └── ...
├── grammar/
│   ├── gr_0003.json
│   └── ...
├── chengyu/
│   ├── cy_0005.json
│   └── ...
└── references/
    ├── hsk-levels.json    # Bulk reference files
    └── phonetic-clusters.json
```

**File content — attributes only, no relationships:**

```json
// content/radicals/rad_0012.json
{
  "id": "rad_0012",
  "glyph": "氵",
  "pinyin": "shuǐ",
  "meaning": "water radical",
  "stroke_count": 3,
  "is_recommended": true,
  "metadata": {
    "variants": ["⺡", "氺"],
    "frequencyRank": 12
  }
}
```

Note: No `characters[]` array — which characters use this radical is a relationship stored in the DB junction table `CharacterRadical`.

**Why it matters:** These files become direct inputs to the Content Publisher when the full migration happens. The file structure and ID convention are already in place — no data transformation needed.

**Bulk data exception:** Very large datasets (9000+ character decompositions) may use a single bulk JSON file for practical import. These can be split later.

### Rule 5: Append-Only Review Log (The Seed Event Stream)

Add a single `review_log` table. Every time any progress is updated, also append one row. The CRUD path continues working exactly as before — the event is a side effect.

```prisma
model ReviewLog {
  id              String   @id @default(uuid())
  user_id         String
  event_type      String   // "card_reviewed" | "quiz_attempted" | "phase_unlocked"
  content_id      String   // "ch_0342" or "rad_0012"
  content_type    String   // "character" | "radical" | "chengyu"
  content_version Int
  payload         Json     // { rating: 4, response_time_ms: 850, phase: 2 }
  created_at      DateTime @default(now())

  @@index([user_id, created_at])
}
```

**Why it matters:** This is the seed event stream. When the Event Hub + Projector is built, it replays this table to rebuild materialized state. Without it, the event sourcing system starts with an empty history and loses all past analytics.

**Cost:** ~100 bytes per row. At 50 reviews/day/user × 1000 users × 365 days = ~18MB/year. Trivial.

---

## DO/DON'T Examples

### DO: Reference content_id in progress tables

```prisma
// GOOD — progress references the stable business key
model CharacterProgress {
  id          String @id @default(uuid())
  userId      String
  characterId String // references content_id "ch_0342", not auto-increment ID
  // ...
}
```

### DON'T: Use auto-increment IDs for content entities

```prisma
// BAD — fragile to reordering and content changes
model Character {
  id Int @id @default(autoincrement()) // WRONG: what happens when content is reordered?
}
```

### DO: Bump content_version on every meaningful change

```javascript
// GOOD — content_version becomes part of the audit trail
await prisma.character.update({
  where: { content_id: "ch_0342" },
  data: {
    definitions: ["not", "have not", "negative prefix"],
    content_version: { increment: 1 },
  },
});
```

### DON'T: Store relationships inside content JSON files

```json
// BAD — relationships belong in junction tables, not content files
{
  "id": "rad_0012",
  "glyph": "氵",
  "characters": ["ch_0342", "ch_1001"] // WRONG: this is a relationship, not an attribute
}
```

---

## What Is Deferred (Not Needed Now)

| Full Architecture Component                     | Why Defer                                             |
| ----------------------------------------------- | ----------------------------------------------------- |
| Content Registry API (separate Express service) | Static file serving works fine at current scale       |
| Event Hub + Event Projector                     | Not needed until CRUD is replaced with event sourcing |
| Client-side IndexedDB cache                     | Not needed until offline is a requirement             |
| CDN distribution                                | Not needed at current scale                           |

---

## Cross-References

- [Character-Level SRS with Reading Context](./character-level-srs-reading-context.md) — How progress models reference `content_id` for polyphonic characters
- [Local-First CQRS for Language Learning](../infrastructure/local-first-cqrs-language-learning.md) — The event sourcing architecture this pattern enables
- [Spaced Repetition Algorithms](../learning-theory/spaced-repetition-algorithms.md) — SM-2 implementation that the review log feeds into
