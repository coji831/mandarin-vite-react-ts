# Story 20.3: Character Decomposition Data

## Description

**As a** developer,
**I want to** import Make Me a Hanzi decomposition and etymology data into the CharacterRadical table,
**So that** mnemonic generation has accurate radical breakdowns to work from.

## Business Value

Without decomposition data, the AI prompt has no radical context — stories would be generic and low-quality. This data foundation enables all downstream mnemonic features (Story 20.1, 20.2). By sourcing from Make Me a Hanzi (MIT-licensed, 9000+ characters), we gain accurate etymology data without manual curation, and the dynamic glyph-to-ID mapping from existing `content/radicals/*.json` keeps the system in sync with our radical data.

## Acceptance Criteria

- [ ] Import script parses Make Me a Hanzi JSON and maps radical glyphs to rad_XXXX IDs
- [ ] Unmapped radicals are logged as warnings, not errors — script continues processing
- [ ] Script is idempotent — safe to run multiple times via Prisma upsert
- [ ] At minimum, the 20 pictograph characters have decomposition entries after running
- [ ] Script runs via `node scripts/import-decomposition-data.js`
- [ ] Source commit hash is pinned in script header to prevent format drift

## Business Rules

1. Radical glyph-to-ID mapping is built dynamically from `content/radicals/*.json` at runtime — no hardcoded mapping
2. Source commit hash of Make Me a Hanzi is pinned to prevent silent format changes
3. Only one Story 20.3 story — this is a data preparation task, not an ongoing feature
4. Unmapped radicals are logged as warnings with glyph + character context
5. A summary of unmapped items is printed at the end of script execution

## Related Issues

- **Epic 20: Mnemonic Stories** _(link to `../README.md`)_ (Parent epic)
- **Story 20.1: Mnemonic Generation Backend** _(link to `story-20-1-mnemonic-generation-backend.md`)_ (Downstream dependency)
- **Story 20.2: Mnemonic Display UI** _(link to `story-20-2-mnemonic-display-ui.md`)_ (Downstream dependency)

## Implementation Status

- **Status**: Planned
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: TBD
