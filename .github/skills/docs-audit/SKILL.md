---
name: docs-audit
description: "Run this skill when auditing documentation or verification artifacts. Covers template compliance, doc↔code truth-check (endpoints, names, counts, data source, links, dates, tooling), rename hygiene, cross-linking, KB extraction format, and Technical Challenges & Solutions format."
user-invocable: true
---

# Docs Audit Skill

## When to Use

- After writing or updating docs (self-audit by Docs Writer)
- During code review when docs were touched (Code Reviewer)
- Before closing a story or epic (doc↔code truth-check)
- When code renames a feature/component/method/endpoint (rename hygiene)
- When reviewing verification artifacts

## Always Check (in order of priority)

1. **Template compliance** — does the doc match the corresponding template's structure exactly (`docs/templates/`)? No extra, duplicate, or non-template sections. Severity HIGH if sections were added or dropped.

2. **Endpoint truth-check** — every documented endpoint exists verbatim (path + verb) in `ROUTE_PATTERNS.*` (`packages/shared-constants/src/index.js`). Any endpoint not in `ROUTE_PATTERNS` does not exist — flag it. Deprecated/renamed endpoints must not be documented. Do not name a module unless a folder exists under `apps/backend/src/modules/`. Severity HIGH.

3. **Names & counts** — feature/module/component names copied verbatim from `apps/frontend/src/features/` and `apps/backend/src/modules/` listings. Counts re-derived by listing the directories, not copied from an older doc. Severity HIGH if a name or count is stale.

4. **Data source claims** — any doc claiming static JSON vs Postgres/API must match the backing code: grep the service/repository for `prisma` vs `content/` / `fs.readFile`. Write only what the code shows. Severity HIGH if the claim is guessed.

5. **Link integrity** — every relative markdown link resolves to an existing target. Broken relative links are HIGH severity.

6. **Dates & tooling** — `Last Updated`/`Last Update` bumped in the same commit as the content edit. No tool/framework named (e.g. Jest, Storyshots) unless present in `package.json` (this repo is Vitest-only). Severity HIGH if a doc names a test runner/framework not in `package.json`.

7. **High-level claims** — README / `docs/architecture.md` claims (counts, commands, state pattern) re-derived from code: list dirs, diff `package.json` scripts, confirm Context/reducer vs Zustand in the actual feature. Severity HIGH if a high-level claim is stale.

8. **Rename hygiene** — after any code rename, grep the old name across `docs/` + `apps/**/docs/` + `verification-artifacts/` + `wip/`; no stale references to renamed items may survive. Severity HIGH if stale references remain.

9. **Cross-linking** — epic BR ↔ epic Implementation ↔ story files linked bidirectionally; story docs ↔ guides ↔ KB articles cross-linked; PR number referenced in both docs; per-story struggle extraction recorded same-day. Severity MEDIUM if a bidirectional link is missing.

10. **KB extraction format** — knowledge-base/guide articles use Problem → Root Cause → Solution → Impact → Alternatives; actionable patterns → `docs/guides/`, conceptual deep-dives → `docs/knowledge-base/`; verbose postmortems removed from story docs after extraction. Severity MEDIUM.

11. **Technical Challenges & Solutions** — non-trivial work (>1h debugging, schema/API misalignment, architectural decisions, error-handling strategy, perf fixes) documented in the story impl with title / Problem / Root Cause / Solution / Impact / Alternatives. Severity MEDIUM if missing where required.

12. **Verification artifacts** — structured outputs in `verification-artifacts/` follow the naming convention `<type>-<epic>-<story>.<ext>`; gate results capture real exit codes; browser checks record what was compared and the result. Severity MEDIUM if evidence is missing or unlabeled.

## Output Format

- Group findings by file path
- For each: file, description, severity (HIGH/MEDIUM/LOW), suggested fix
- End with summary: X violations found (Y high, Z medium)
