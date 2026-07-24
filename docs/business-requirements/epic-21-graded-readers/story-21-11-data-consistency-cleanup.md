# Story 21.11: Data Consistency Cleanup — Radical JSON → API

**Last Update:** July 24, 2026

## Description

**As a** developer,
**I want to** radical data to have a single source of truth by migrating `hsk_characters` from radical JSON files into the database and exposing them via API,
**So that** we eliminate data drift between content JSON and the database, enforce the all-in-DB architecture decision, and prevent future inconsistency bugs.

## Business Value

The technical redesign identified that radical JSON files in `content/characters/` contain a `metadata.hsk_characters` field that lists example characters for each radical — duplicating relationship data that now exists in the `CharacterRadical` table (populated by Story 21.1). This violates the all-in-DB architecture decision (ADR: "Content JSON stores only intrinsic attributes — all M:N relationships live in the DB"). The current state risks data drift: if a character is added to the DB but the JSON is not updated (or vice versa), the two sources become inconsistent. This story strips the duplicated data from JSON files, adds a backend API endpoint querying the source-of-truth `CharacterRadical` table, updates the frontend Radical Detail Card to consume the API instead of JSON, and adds a CI validation script to prevent future violations. Estimated effort is ~1-2 days for 2 critical findings resolved.

## Acceptance Criteria

- [ ] All 20 radical JSON files in `content/characters/` stripped of `metadata.hsk_characters` field
- [ ] `GET /api/v1/radicals/:id/characters` endpoint created, querying `CharacterRadical` + `Character` tables
- [ ] Endpoint returns 200 with character array for valid radical IDs, 404 for unknown radical IDs
- [ ] Radical Detail Card (frontend) updated to fetch example characters from the API instead of reading from JSON
- [ ] CI validation script (`validate:radical-content`) created — fails if any radical JSON contains `hsk_characters`
- [ ] CI script added to `package.json` scripts and GitHub Actions workflow (or equivalent CI pipeline)
- [ ] `content/manifest.json` updated if references to `hsk_characters` exist
- [ ] Radical Detail Card gracefully handles loading, empty, and error states from the API call
- [ ] Unit tests for the new endpoint (service + controller)
- [ ] MSW handlers created for the new endpoint
- [ ] 0 lint errors across all changed files

## Business Rules

1. **Single Source of Truth** — `CharacterRadical` table is the authoritative source for radical-character relationships. JSON files contain only intrinsic radical attributes (glyph, meaning, stroke count, mnemonic, etc.).
2. **JSON Cleanup Scope** — Only `metadata.hsk_characters` is stripped. No other fields in radical JSON files are modified. The structure, metadata fields, and all other data remain intact.
3. **Backward-Compatible Frontend** — Radical Detail Card currently reads `hsk_characters` from JSON directly. After this change, it fetches from the API. Visual appearance must remain the same — only the data source changes. If Epic 19 has planned a redesign of Radical Detail Card, the frontend change here is minimal (swap data source) and the UI redesign is deferred to Epic 19.
4. **CI Validation** — The CI script checks every radical JSON file in `content/characters/` for any occurrence of `"hsk_characters"`. If found, the script exits with code 1. This prevents future reintroduction of the duplicated field.
5. **Idempotent Cleanup** — The JSON cleanup script can be re-run safely. It only removes `metadata.hsk_characters` — it does not modify any other fields. If the field is already absent, the script does nothing for that file.

## Related Issues

- Epic 21: Graded Readers — BR (`../README.md`) (epic parent)
- **Story 21.1: Data Lifecycle** ([BR](story-21-1-data-lifecycle.md)) (dependency — CharacterRadical table exists and populated)
- **Story 21.2: Character Content Generation** ([BR](story-21-2-character-content.md)) (dependency — Character table populated for endpoint responses)
- Epic 19: Radicals & Character Details (coordination — Radical Detail Card frontend ownership)

## Implementation Status

- **Status**: Planned
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: TBD
