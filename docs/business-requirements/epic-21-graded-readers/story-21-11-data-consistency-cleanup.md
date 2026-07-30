# Story 21.11: Data Consistency Cleanup — Radical JSON → API

**Last Update:** July 30, 2026

## Description

**As a** developer,
**I want to** radical data to have a single source of truth by migrating `hskCharacters` from the radical JSON aggregate into the database and exposing them via API,
**So that** we eliminate data drift between content JSON and the database, enforce the all-in-DB architecture decision, and prevent future inconsistency bugs.

## Business Value

The technical redesign identified that the radical JSON aggregate file `content/radicals/radicals.json` contains a top-level `hskCharacters` field on each radical object — an array of example characters that duplicates relationship data now stored in the `CharacterRadical` table (populated by Story 21.1). This violates the all-in-DB architecture decision (ADR: "Content JSON stores only intrinsic attributes — all M:N relationships live in the DB"). The current state risks data drift: if a character is added to the DB but the JSON is not updated (or vice versa), the two sources become inconsistent.

This story strips the duplicated `hskCharacters` field from the single aggregate file, adds a backend API endpoint querying the source-of-truth `CharacterRadical` table, migrates ALL frontend and backend consumers to use the API/DB instead of JSON, adds a cleanup script, and adds a CI validation script to prevent future violations.

**Scope expansion:** Originally planned as a narrow JSON-cleanup + RadicalDetailCard migration. During architectural review, the decision was made to do it all in this story:

- Refactor BOTH backend consumers (`RadicalGateStrategy` + `ReviewService`) to query the DB instead of `hskCharacters`
- Migrate BOTH frontend consumers (`RadicalDetailCard` + `RadicalTreesTab`) to fetch from the API
- Convert `useMergedRadicals` to rely solely on the DB-backed API (remove `hskCharacters` matching path)
- Add cleanup script + CI validation

## Acceptance Criteria

- [x] Single aggregate file `content/radicals/radicals.json` stripped of top-level `hskCharacters` field from all 20 radical entries (using cleanup script)
- [x] `GET /api/v1/radicals/:id/characters` endpoint created, querying `CharacterRadical` + `Character` tables
- [x] Endpoint returns 200 with character array for valid radical IDs, 404 for unknown radical IDs
- [x] RadicalDetailCard (frontend) updated to fetch example characters from the API instead of reading from JSON — with loading/empty/error states including retry button
- [x] RadicalTreesTab (frontend) updated to fetch characters per radical from the API instead of reading from JSON — with loading/empty/error states
- [x] `useMergedRadicals` hook updated to remove the `hskCharacters` matching path (Source 1); rely solely on the DB-backed API call (Source 2)
- [x] `RadicalGateStrategy` (backend) refactored to query `CharacterRadical` + `Character` tables instead of reading `hskCharacters` from JSON
- [x] `ReviewService` (backend) refactored (`includeCharacterRadical` path) to query `CharacterRadical` + `Character` tables instead of reading `hsk_characters` from JSON
- [x] Cleanup script (`scripts/cleanup-radical-content.ts`) created — strips `hskCharacters` from `content/radicals/radicals.json` safely
- [x] CI validation script (`scripts/validate-radical-content.ts`) created — fails if `content/radicals/radicals.json` contains any `hskCharacters` field
- [x] Both scripts added to `package.json` scripts section
- [x] Route constant `radicalsCharacters` added to `packages/shared-constants/src/index.js` with `.d.ts` type declaration
- [x] MSW handlers created for the new endpoint (`apps/frontend/src/mocks/handlers/radicals-handlers.ts`)
- [x] Unit tests for the new backend endpoint (service + controller)
- [x] Updated tests for RadicalDetailCard, RadicalTreesTab, Phase3TreeView, TreeRootNode, CharacterListNode, mergeRadicals
- [x] Updated Storybook mock data (CharacterHub stories, .storybook/msw-handlers.ts)
- [x] 0 lint errors across all changed files

## Business Rules

1. **Single Source of Truth** — `CharacterRadical` table is the authoritative source for radical-character relationships. The JSON aggregate contains only intrinsic radical attributes (glyph, meaning, stroke count, mnemonic, etc.).
2. **JSON Cleanup Scope** — Only the top-level `hskCharacters` field is stripped from each radical object in `content/radicals/radicals.json`. No other fields are modified. The structure and all other data remain intact.
3. **Backward-Compatible Frontend** — All consumer components change only their data source (JSON → API). Visual appearance must remain the same — only the data retrieval method changes.
4. **CI Validation** — The CI script parses `content/radicals/radicals.json` and checks for any object containing the key `"hskCharacters"`. If found, the script exits with code 1. This prevents future reintroduction of the duplicated field.
5. **Idempotent Cleanup** — The cleanup script can be re-run safely. It only removes `hskCharacters` from each radical entry — it does not modify any other fields. If the field is already absent, the script does nothing.
6. **Backend Refactoring — RadicalGateStrategy** — Must use Prisma to query `CharacterRadical` + `Character` tables. Currently reads `file.hskCharacters` from the JSON aggregate. After change, loads `CharacterRadical` records for all radicals and builds the reverse character→radical map from DB data.
7. **Backend Refactoring — ReviewService** — The `includeCharacterRadical` path in `getReviewItems()` must query `CharacterRadical` + `Character` tables instead of `radical.metadata?.hsk_characters`. Each `CharacterRadical` record maps to one review item (character → which radical).
8. **Frontend Refactoring — useMergedRadicals** — Source 1 (matching via `r.metadata.hsk_characters`) is removed entirely since `hskCharacters` is stripped from JSON. The hook relies only on Source 2 (API call to `GET /v1/radicals/character/:glyph`). Deduplication logic is simplified to a single source.
9. **Frontend Refactoring — RadicalTreesTab** — The `getCharactersForRadical` callback currently returns `radical.metadata.hsk_characters ?? []`. After change, it fetches from `GET /api/v1/radicals/:id/characters`. Needs to handle async loading for possibly multiple radicals displayed in the tree view.

## Related Issues

- Epic 21: Graded Readers — BR (`../README.md`) (epic parent)
- **Story 21.1: Data Lifecycle** ([BR](story-21-1-data-lifecycle.md)) (dependency — `CharacterRadical` table exists and populated)
- **Story 21.2: Character Content Generation** ([BR](story-21-2-character-content.md)) (dependency — `Character` table populated for endpoint responses)
- Epic 19: Radicals & Character Details (coordination — RadicalDetailCard, RadicalTreesTab frontend ownership)

## Implementation Status

- **Status**: Implemented
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: TBD
