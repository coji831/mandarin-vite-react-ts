---
purpose: Copyable epic implementation template
status: active
last-verified: 2026-10-31
type: template
---

# Template For Epic Implementation

**Last Updated:** October 31, 2026

# Epic [EPIC-NUMBER]: [Epic-Title]

## Epic Summary

**Goal:** [One-sentence-technical-goal-statement]

**Key Points:**

- <Technical point 1 - most critical insight>
- <Technical point 2 - second most important point>
- <Technical point 3 - third most important point>
- <Technical point 4 - fourth most important point>
- <Technical point 5 - fifth most important point>

**Status:** <Planned/In Progress/Completed>

**Last Update:** <Date>

## Technical Overview

[Describe the technical objectives and scope of the implementation]

## Architecture Decisions

1. <Decision 1 - be specific about technical choices and reasoning>
2. <Decision 2 - include rationale and alternatives considered>

## Technical Challenges & Solutions

<Technical challenges encountered and how they were addressed. **REQUIRED when non-trivial — debugging >1h, schema issues, architectural decisions. If none, write 'None of note' (one line).**>

### Doc Truth-Check

- [ ] Endpoints match `ROUTE_PATTERNS` in `packages/shared-constants/src/index.js` (path + verb copied verbatim)
- [ ] Feature/module/component names verified against `apps/backend/src/modules/` and `apps/frontend/src/features/`
- [ ] Data source (static JSON vs Postgres/API) matches the backing service/repository code
- [ ] All relative markdown links resolve
- [ ] Last Updated / Last Update date is current (same commit as the edit)

> **Note:** PR / Merge Date / Key Commit stay literal `TBD` until commit, filled same-commit; never merge with TBD.

## Technical Implementation

### Architecture

<Describe the technical architecture in detail with component relationships, data flows, and implementation patterns>

// Optional: Include simplified architecture diagram in ASCII or code example
Client -> [Component A] -> [Component B] -> Database

### API Endpoints (if applicable)

GET /api/<endpoint>

**Parameters:**

- <param1>: <description>
- <param2>: <description, including data types and validation rules>

**Response:**

- <detailed response structure with example>

### Component Relationships

## Code Review Outcome

<Reviewer verdict (`APPROVED` / `CHANGES-REQUESTED`), then a table of findings ordered by severity with the resolution for each. "No separate reviewer pass was run" is only acceptable when no review link ran — say so explicitly rather than omitting the section.>

| #   | Severity              | Finding                            | Resolution                           |
| --- | --------------------- | ---------------------------------- | ------------------------------------ |
| 1   | <blocker/major/minor> | <what was wrong, with `file:line`> | <what changed, or "carried forward"> |

### Carry-forward (recorded, deliberately not fixed here)

- <A known gap this epic exposed and chose not to close, with why and where it belongs instead>

## Epic Close — Documentation Duty

<The Phase 5 surface table in `.github/copilot-instructions.md` §Epic & Story Lifecycle enumerates what must be
re-verified. State each surface's outcome; a surface that needed no change is still recorded as checked.>

| Surface                                | Outcome                                                        |
| -------------------------------------- | -------------------------------------------------------------- |
| `docs/architecture.md`                 | <updated: what changed / verified current / n/a with reason>   |
| `README.md`, `apps/*/README.md`        | <...>                                                          |
| `docs/knowledge-base/`, `docs/guides/` | <extracted: which article / none needed, because ...>          |
| `docs/coverage.md`, `docs/README.md`   | <`npm run generate:system-map` run; `check:system-map` result> |
| Epic + story docs                      | <status / dates / AC boxes / PR number>                        |
