# Story 21.6: Phonetic Clusters

**Last Update:** July 24, 2026

## Description

**As a** learner,
**I want to** browse characters grouped by shared phonetic elements,
**So that** I can recognize pronunciation patterns and guess how new characters sound.

## Business Value

Phonetic clusters help learners recognize patterns in character pronunciation — a key skill for Chinese literacy. By grouping characters that share a phonetic component (e.g., 青 family: 请情清晴), learners can more easily remember pronunciations and make educated guesses about unfamiliar characters. This is a standalone bonus feature that can be built independently of the reader pipeline.

## Acceptance Criteria

- [ ] Characters grouped by shared phonetic element (e.g., 青 family: 请情清晴)
- [ ] Each group card shows: phonetic pattern, characters in group, pronunciation changes
- [ ] Clickable character → opens CharacterHub
- [ ] Filter by HSK level (dropdown/pills)
- [ ] Static data — no backend needed. Hand-curated for HSK 1-2 range.
- [ ] All states: loading (JSON fetch skeleton), empty (no clusters match filter), populated

## Business Rules

1. **Static data only** — No backend required. Data lives in `public/data/phonetic-clusters/clusters.json`.
2. **Hand-curated** — Clusters are curated manually for the HSK 1-2 range. No automated generation.
3. **HSK 1-2 focus** — Only characters in HSK levels 1 and 2 are included initially. Can be expanded later.
4. **CharacterHub integration** — Clicking a character opens CharacterHub for full detail view.
5. **PhoneticClustersTab** — Renders as a tab within the readers feature, using existing tab/layout components.

## Related Issues

- Epic 21: Graded Readers — BR (`../README.md`) (epic parent)
- **Story 21.1: Data Lifecycle** ([BR](story-21-1-data-lifecycle.md)) (dependency — character data needed)
- **Story 21.2: Character Content Generation** ([BR](story-21-2-character-content.md)) (dependency — character enrichment with phonetic data)
- Can run in parallel with Stories 21.3-21.5

## Implementation Status

- **Status**: Planned
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: TBD
