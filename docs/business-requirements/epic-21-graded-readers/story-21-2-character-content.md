# Story 21.2: Character Content Generation

**Last Update:** July 24, 2026

## Description

**As a** learner,
**I want to** characters to be enriched with decomposition data, phonetic component analysis, classification (pictograph/phono-semantic), and coverage milestones,
**So that** the reading experience includes rich character-level context.

## Business Value

Character enrichment is the second critical prerequisite for the epic — without it, the reading UI cannot display frequency badges, HSK pills, phonetic decomposition layouts, or DB-driven phonetic clusters. This story imports Make Me a Hanzi decomposition data, infers phonetic components, populates character classification and `CharacterRadical.decompositionType`, and generates the pinyin→character reverse index. It unlocks the character-level context that makes the reading experience pedagogically valuable.

## Acceptance Criteria

- [ ] Make Me a Hanzi decomposition data imported into CharacterComponent model for all 2,971 characters
- [ ] Character.classification populated for all characters: "pictograph" | "ideograph" | "phono_semantic" | "compound_ideograph" | null
- [ ] Character.phoneticComponentId populated for phono-semantic characters, referencing the phonetic component Character ID
- [ ] CharacterRadical.decompositionType populated for all characters: "semantic" | "phonetic" | "remaining" | null
- [ ] PinyinCharacterMapping table populated for all 2,971 characters, creating a reverse index from pinyin syllable → character
- [ ] PinyinSyllable table verified with ≥1,300 entries
- [ ] CharacterComponent model created with componentId, characterId, role fields
- [ ] Component scaffold (Component model) seeded with basic radical-like components
- [ ] Content files regenerated: `content/characters/characters.json` includes classification, phoneticComponentId
- [ ] Seed script is idempotent (safe to re-run)
- [ ] Character coverage milestone verified: 500+ characters with metadata.classification populated

## Business Rules

1. **Make Me a Hanzi as decomposition source** — Import structural decomposition data from the Make Me a Hanzi dataset. Each character's component breakdown is stored in the CharacterComponent model.
2. **Classification categories** — Characters classified into: pictograph (象形), ideograph (指事), phono_semantic (形声), compound_ideograph (会意), or null (unclassified).
3. **Phonetic component inference** — For phono-semantic characters, identify the component that provides the pronunciation hint. Store as `phoneticComponentId` on Character, referencing another Character ID.
4. **Decomposition type on CharacterRadical** — Each radical link gets a `decompositionType`: "semantic" (meaning-related), "phonetic" (sound-related), "remaining" (leftover stroke), or null (unknown).
5. **Pinyin→character reverse index** — PinyinCharacterMapping enables queries like "find all characters pronounced 'shi'". Used by phonetic clusters and future search features.
6. **Idempotent seeding** — All seed operations use upsert/ON CONFLICT DO NOTHING patterns. Safe to re-run without duplicates.

## Related Issues

- Epic 21: Graded Readers — BR (`../README.md`) (epic parent)
- **Story 21.1: Data Lifecycle** ([BR](story-21-1-data-lifecycle.md)) (dependency — character table and schema must exist)

## Implementation Status

- **Status**: Planned
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: TBD
