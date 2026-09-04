---
purpose: Hub entity-ID contract
status: active
last-verified: 2026-09-03
type: guide
---

# Hub Entity-ID Contract

**Category:** Frontend Development
**Last Updated:** September 3, 2026

---

## The Contract

> **Hubs and their APIs are not uniformly keyed.** The character/word hubs and
> their APIs are **glyph-keyed** (书, 桌子) — `openHub()`/`EntityRef.entityId`
> expects the character/word **glyph**, not a DB id. Grammar (and radical)
> entities are **`content_id`-keyed** (`gr_XXXX`). Seed data and the grammar API
> store the DB **`content_id`** (e.g. `ch_20070`) inside example segments — so
> the frontend must **translate `content_id` → glyph for `character`/`word`
> tokens** before opening the hub, and pass `content_id` through unchanged for
> every other entity type.

## The Mismatch

Grammar example sentences ship **pre-segmented clickable tokens** (authoring
JSON → seed → API). Each token carries an `entityId` referencing the target
entity's `content_id`:

```json
{
  "text": "书",
  "pinyin": "shū",
  "gloss": "book",
  "entityType": "character",
  "entityId": "ch_20070"
}
```

But the character/word hub entries in `entityHubRegistry` — and the character
APIs (`GET /v1/characters/:glyph`, `GET /v1/words/:glyph`) — are
**glyph-keyed**: `openHub({ entityType: "character", entityId: "书", label })`
must receive the glyph 书, not `ch_20070`. Passing the `content_id` through
blindly opens a hub for a non-existent glyph.

## The Translation (`segmentToEntityRef`)

`apps/frontend/src/features/grammar/utils/grammarData.ts` —
`segmentToEntityRef` (pure, unit-tested) is the single translation point:

```ts
export function segmentToEntityRef(segment: GrammarSegment): EntityRef | null {
  if (!segment.entityId || !segment.entityType) return null;
  // character/word hubs + APIs are GLYPH-keyed; other types are content_id-keyed.
  const isGlyphKeyed = segment.entityType === "character" || segment.entityType === "word";
  // Guard: a glyph-keyed token with an empty `text` must not open the hub with a
  // blank entityId — treat it as plain text.
  if (isGlyphKeyed && !segment.text) return null;
  return {
    entityType: segment.entityType,
    entityId: isGlyphKeyed ? segment.text : segment.entityId,
    label: segment.pinyin || segment.text,
  };
}
```

- `character` / `word` → `entityId = segment.text` (the glyph 书, 桌子).
- every other `entityType` (grammar, radical, …) → `entityId = segment.entityId`
  (`content_id`) passed through unchanged.

## Fix Context (2026-08-06)

A reviewer round (commits after `5cd43667`) surfaced this contract
mismatch: grammar→hub cross-linking initially passed the seed `content_id`
(`ch_20070`) to the glyph-keyed character hub, producing dead/blank hubs for
linked tokens. The fix added the glyph translation in `segmentToEntityRef`
(the "grammar→hub glyph contract" fix) plus unit tests for the translation and
the empty-glyph guard. It is a reusable >1h lesson: **the hub/API key
convention differs per entity type — never assume one keying scheme; check
`entityHubRegistry` + the entity's API routes before wiring cross-links.**

## Rule of Thumb

| Entity type | Hub/API keyed by          | From a grammar segment use |
| ----------- | ------------------------- | -------------------------- |
| `character` | glyph (书)                | `segment.text`             |
| `word`      | glyph (桌子)              | `segment.text`             |
| `grammar`   | `content_id` (`gr_XXXX`)  | `segment.entityId`         |
| `radical`   | `content_id` (`rad_XXXX`) | `segment.entityId`         |
