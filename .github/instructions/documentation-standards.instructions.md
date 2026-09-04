---
description: "Use when writing or updating business requirements, implementation docs, or knowledge base articles. Covers template compliance, high-level guidelines, technical challenges documentation, and KB extraction."
applyTo: "docs/**/*.md, docs/**/*.html, apps/frontend/src/features/**/docs/**/*.md, apps/backend/src/modules/**/docs/**/*.md, apps/backend/docs/**/*.md"
---

# Documentation Standards

## How To Create/Update Docs (Numbered Steps)

### Creating a New Epic

1. Copy `docs/templates/epic-business-requirements-template.md` → `docs/business-requirements/epic-<num>-<slug>/README.md`
2. Copy `docs/templates/epic-implementation-template.md` → `docs/issue-implementation/epic-<num>-<slug>/README.md`
3. Fill all sections following the template structure exactly — no extra sections
4. Link epic BR ↔ epic Implementation ↔ story files bidirectionally
5. If stories are known, scaffold story files using story templates

### Creating a New Story

1. Copy `docs/templates/story-business-requirements-template.md` → `docs/business-requirements/epic-<num>-<slug>/story-<epic>-<story>-<short>.md`
2. Copy `docs/templates/story-implementation-template.md` → `docs/issue-implementation/epic-<num>-<slug>/story-<epic>-<story>-<short>.md`
3. Fill all sections — link back to epic BR + implementation README
4. During implementation, add "Technical Challenges & Solutions" for non-trivial problems (debugging >1h, schema issues, architectural decisions)

### Story Numbering Convention

1. **Stories are 1-indexed.** Always start at 1 (21.1, 21.2, 21.3), never 0 (21.0).
2. A "prerequisite" or "data migration" story is still a real story — give it the first number (21.1), not 21.0.
3. If a new story needs to be inserted before existing ones, **renumber all subsequent stories** to maintain sequential order. Do not leave gaps or use .0/.5 suffixes.
4. Story file names use zero-padded single digits: `story-21-1-data-lifecycle.md`, `story-21-2-passage-generation.md`.
5. Epic-level story tables must use the same 1-indexed numbering.

### Updating Existing Docs

1. Open the template at `docs/templates/` to cross-check current structure
2. Update content — do NOT add sections not in the template
3. Bump `last-verified` (frontmatter) and the body `**Last Updated:**` footer — both in the same commit (see the Freshness rule below)
4. Release-scoped references: durable/evergreen/high-level docs describe the system by feature name + date, never by story/epic/PR number — see **Release-scoped references (epic/story/PR numbers)** below for the full scope, exceptions, and pre-commit grep

### Release-scoped references (epic/story/PR numbers) — where they may NOT appear

Durable, evergreen, and high-level docs describe the system by FEATURE NAME, never by release number. Story/epic ids and `PR #N` are scoped to the epic's own files; once a change ships, its docs must stand on their own.

**Scope (this rule applies to):** `docs/architecture.md`, root + package READMEs (any `README.md` outside the epic folders), `terraform/README.md`, durable guides under `docs/guides/**` (getting-started, setup, operations, data, conventions, integrations — NOT epic folders under `docs/business-requirements` / `docs/issue-implementation`), evergreen KB articles, and `.html` onboarding under `docs/guides/` (e.g. `iac-onboarding.html`). It also applies to leaf `purpose:` frontmatter, because that string feeds the generated `docs/README.md` map row.

**Exceptions — release-scoped references ARE allowed when:**

1. The doc is itself the epic/story's file (BR/IMP READMEs + story files), an epic index, a decision/planning record, or an archive/retired leaf preserved for traceability.
2. The doc's own frontmatter declares it release-scoped (`tags:` contains the epic id or `release`) AND its `purpose:` is that release (e.g. an env-isolation verification artifact for a named release).
3. The reference is a SCOPED CROSS-LINK to a story/epic BR/IMP doc (a link, not a claim), or a KB "When Adopted" / "Related" provenance field.
4. It is a clearly-marked historical note pinned to a DATE ("as of 2026-08-22", "retired 2026-08-25", "added August 2026") — the date is mandatory; a bare "since story 24-17" is never enough.

✅ DO name the durable system property and pin history to a date:

- "The backend is a NestJS 11 modulith" (not "since Epic 24 the backend is…")
- "The additive-only migration set (`20260821175536_add_srs_card_state`, 2026-08) is never rolled back" (not "the Epic 24 migration")
- "Per-PR preview isolation: per-env JWT + `JwtService` env claim + sandbox SA" (not "NEW (Epic 24)" / "hardened in story 24-17")
- "…were retired when the single-page rollback note landed (2026-08-25)" (not "retired in 24-17")
- "See [story BR](../business-requirements/…/story-24-17-….md)" — scoped cross-links OK.

❌ DON'T write behavior as if the release id were a durable system property:

- "Since Epic 24 / after epic 24 / pre-24-17, the backend…"
- "The Epic 24 migration is additive-only"
- "**NEW (Epic 24).**"
- "Why no Develop (the 24-17 rule)"
- "(Story 22.1)" as the label for a current pipeline step, with no date

**Truth-check before commit:** run
`grep -rniE "epic-[0-9]+|epic [0-9]+|story-[0-9]+-[0-9]+|story [0-9]+\.[0-9]+|PR #[0-9]+"`
over every file in the Scope list above; every hit must satisfy an Exception above, or be rewritten to a descriptive feature name + date. `purpose:` edits feed the generated `docs/README.md` map — regenerate it with `npm run generate:system-map` and gate it with `npm run check:system-map` (the map and its leaves must not disagree). Bump `last-verified` and `Last Updated` in the same commit.

### Extracting Knowledge Base Articles

After resolving struggles >3h or discovering reusable patterns:

1. Create file in `docs/knowledge-base/` (actionable patterns → `docs/guides/`)
2. Use format: Problem → Root Cause → Solution → Impact → Alternatives
3. Cross-link between story docs, guides, and KB articles
4. Remove verbose postmortems from story implementation docs after extraction
5. Verify story/epic docs still match templates exactly after removal

## Strict Template Compliance

- All documentation must strictly match the structure and sections of the corresponding template
- Do NOT add extra, duplicate, or non-template sections
- When updating, always cross-check with the latest template

## Doc Truth-Check (Verify Docs Against Code)

Before writing or updating any doc, verify every claim against the actual codebase. A doc that names things that don't exist (or keeps stale names for things that changed) is worse than no doc.

1. **Endpoints** — Before writing any endpoint, find the matching `ROUTE_PATTERNS.*` in `packages/shared-constants/src/index.js` and copy the path + verb exactly.
   - ✅ DO copy the path and verb verbatim from `ROUTE_PATTERNS`.
   - ❌ DON'T document an endpoint that is not in `ROUTE_PATTERNS` — it does not exist; flag it instead.
   - ❌ DON'T name a module (learning/gamification/vocabulary) unless a folder exists under `apps/backend/src/modules/`.
2. **Names & counts** — Before writing a feature/module/component/function name or count, list `apps/backend/src/modules/` and `apps/frontend/src/features/` and copy the names verbatim.
   - ✅ DO re-derive counts by listing the directories.
   - ❌ DON'T copy names or counts from an older doc.
3. **Data source** — When a doc claims static JSON vs Postgres/API, grep the backing service/repository for `prisma` vs `content/` / `fs.readFile` and write only what the code shows.
   - ✅ DO match the claim to the actual backing code.
   - ❌ DON'T guess the data source.
4. **Links** — Every relative markdown link must resolve.
   - ✅ DO verify each target exists before commit.
   - ❌ DON'T commit a doc with a broken relative link.
5. **Dates & tooling** — Update `Last Updated` / `Last Update` in the same commit as the edit; never name a tool/framework (e.g. Jest, Storyshots) without confirming it in the relevant `package.json` (this repo is Vitest-only).
   - ✅ DO bump the date in the same commit as the content edit.
   - ❌ DON'T name a test runner/framework not present in `package.json`.
6. **High-level claims** — Re-derive README / `docs/architecture.md` claims (counts, commands, state pattern): list dirs, diff `package.json` scripts, confirm Context/reducer vs Zustand in the actual feature.
   - ✅ DO re-derive claims from the code.
   - ❌ DON'T trust an older doc for current state-pattern or script claims.
7. **Rename hygiene** — When code renames a feature folder/component/method/endpoint, the SAME commit must update every doc referencing the old name.
   - ✅ DO grep the old name across `docs/` + `apps/**/docs/` and fix all hits.
   - ❌ DON'T leave stale references to renamed items in any doc.

## Leaf Front-Matter Standard (Tracked Leaves)

**Frontmatter is THE standard.** Every active, tracked `docs/` leaf MUST carry the YAML block below. The map (`docs/README.md`), the freshness scan (`docs/coverage.md`, A10), and the per-class status vocabulary are all generated/derived from it. Prose markers (`**Status:**`, `**Last Updated:**`, `**Purpose:**`, `**Last Update:**`) are **legacy/archive-only** — the parser still reads them for archive leaves (exempt, untouched), and swept leaves may keep a body `**Last Updated:**` footer (see Freshness rule), but never use prose markers for new active leaves.

The repo uses a **Map-and-Leaves** docs model: `docs/README.md` is the generated system **map** (root → 7 layers → small branches → leaf rows); the **leaves** hold all depth and are loaded just-in-time. **The map is generated; the leaves are authored.** Humans hand-maintain exactly two things per tracked leaf — its one-line `purpose:` and its `status:` (+ `last-verified`) — and the generator (`scripts/generate-system-map.mjs`) emits the map rows from those sources of truth. Never hand-sync the map; a committed map that disagrees with its sources is a build failure (`check:system-map`), not a TODO.

**Tracked leaves** (active epics' READMEs, decision records, flagship design/architecture docs, feature `design.md` files, area indexes, guides, conventions, KB/README leaves) carry a YAML front-matter block at the very top of the file:

```yaml
---
purpose: <one sentence — feeds the map row>
status: <per-class vocabulary below>
last-verified: YYYY-MM-DD
type: <one of the 12 types below>
audience: <optional — new-dev | frontend | backend | agents | all>
covers: <optional — comma-separated list of the units this doc inventories; opt-in for the count-truth linkage check>
tags: <optional — free-form>
---
```

**Required:** `purpose`, `status`, `last-verified`, `type`. **Optional:** `audience`, `covers`, `tags`. **There is no `title` field** — the H1 heading is canonical; never duplicate it in frontmatter.

Rules:

1. **`purpose:` is one sentence.** It becomes the map row's one-line purpose. If it needs two sentences, shorten it.
2. **`status:` uses the per-class vocabulary verbatim** — adopt the repo's existing vocab, never invent new words:

   | Class              | Vocabulary                                                                                      |
   | ------------------ | ----------------------------------------------------------------------------------------------- |
   | Epics              | `planned` · `in-progress` · `completed` · `parked` · `retired` · `deferred`                     |
   | Docs / guides / KB | `active` · `superseded` · `retired` · `review` (machine-derived when `last-verified` > 6 weeks) |
   | Pages              | `conforms` · `diverges`                                                                         |
   | Components         | `green` · `red`                                                                                 |
   | Decisions          | `proposed` · `ratified` · `superseded`                                                          |
   | Business           | `ratified` · `open` · `deferred`                                                                |
   | Research briefs    | `review` · `promoted` · `superseded`                                                            |

3. **`type:` is required for new leaves.** It selects the status-vocabulary class, the freshness scan group, and sort order — the generator no longer classifies by path alone. The taxonomy:

   | `type`         | Meaning                          | Status vocab class | Typical path                                          |
   | -------------- | -------------------------------- | ------------------ | ----------------------------------------------------- |
   | `epic`         | active epic README               | Epics              | `docs/business-requirements/epic-<N>-*/README.md`     |
   | `design`       | feature/design spec              | Docs/guides        | `features/*/docs/design.md`, `guides/design/*.md`     |
   | `convention`   | coding convention                | Docs/guides        | `guides/conventions/*.md`                             |
   | `guide`        | how-to guide                     | Docs/guides        | `guides/**/*.md`                                      |
   | `template`     | copyable template                | Docs/guides        | `docs/templates/*-template.md`                        |
   | `area-index`   | directory index                  | Docs/guides        | `*/README.md` that indexes a dir                      |
   | `readme`       | component/package/feature README | Docs/guides        | `shared/components/README.md`, `packages/*/README.md` |
   | `architecture` | system design doc                | Docs/guides        | `docs/architecture.md`, backend `design.md`           |
   | `decision`     | ADR / decision record            | Decisions          | `guides/adr/*.md`, decision rows in `epics-25-40.md`  |
   | `business`     | business model / research        | Business           | `docs/business/**`                                    |
   | `planning`     | epic plan / roadmap              | Decisions          | `planning/epics-25-40.md`                             |
   | `data-doc`     | data/content pipeline doc        | Docs/guides        | `guides/data/seed-pipeline.md`                        |

   `type` classifies a leaf; it does NOT assign its layer or branch — that comes from `LAYER_ROOTS` (see Tree/branch below).

4. **`review` is machine-derived, not typed.** A docs-class leaf whose `last-verified` is older than **6 weeks** flips to `review` at map generation; a linkage/count-truth failure (see rule 7) also forces `review`. A human only sets `active` / `superseded` / `retired`.
5. **`last-verified: YYYY-MM-DD`** — the date the status was last truth-checked against the code. Bump it in the same commit as the edit/truth-check.
6. **`audience:` / `tags:` are optional** — routing/search sugar, not machine inputs. `audience` is one of `new-dev | frontend | backend | agents | all`.
7. **`covers:` is optional and opt-in** — a comma list of the units the doc inventories (backend modules, feature names, components). Opting in enables the machine **count-truth** linkage check: the generator diffs the declared list against the actual directories and flags a mismatch (e.g. a `design.md` that names 13 modules when the `modules/` dir has 15).
8. **≤1 line per map row.** A row is `What | one-line purpose | status | link`, nothing more. Never paste leaf prose into the map — the deep-link is the content primitive (the map routes, it never hoards).
9. **Archive/story files are exempt.** Only tracked leaves carry front-matter; the ~500 archive/story files stay untouched.

### Tree / branch structure (the map)

The generated tree in `docs/README.md` is the map: **root → 7 layers → small branches → leaf rows**.

- **Root** (authored): intro, mermaid, TL;DR, "What are you here for?" routes, status-vocab pointer — navigation, not inventory.
- **Layers 1–7** (large branches): layer membership is assigned by **`LAYER_ROOTS`** — a single deterministic root→layer table in `scripts/generate-system-map.mjs` (the generator owns it, not per-file fields). Each layer renders as a collapsed `<details id="layer-N">` with an aggregate status + leaf count.
- **Small branches**: subdirectories under a layer's roots (e.g. L5 → getting-started / setup / operations / testing / integrations / data / conventions / knowledge-base / templates / audits / automation / visualizations). A flat layer has none.
- **Leaves**: one row per tracked leaf — `purpose | status | link` — emitted automatically from frontmatter. A leaf missing frontmatter renders with a `⚠️ no frontmatter` linkage note (never a hard fail until the M3 hardening).
- **`branch:` override (rare)**: if a leaf's natural root placement is wrong, `branch: <layer-or-small-branch>` frontmatter moves it; the generator emits a **linkage note** whenever an override is used so overrides stay exceptional. Prefer fixing the file's placement over an override.

Don't hand-write or re-derive the tree — if layer membership is wrong, edit `LAYER_ROOTS`; if the tree disagrees with the leaves, that's a `check:system-map` failure.

### `.github/` special format (agentic layer)

Instructions, agents, and skills do **NOT** carry docs frontmatter — `.github/` is excluded from the sweep by decision (their frontmatter serves the agent runtime, not the map). The agentic layer is tracked layer-level from **`.github/AGENTS.md`**, the single enumerator: `instructions:` / `agents:` / `skills:` lists + `last-verified:`. Per-leaf purpose in the map's L6 (Agentic) branch comes from:

- **instructions:** `AGENTS.md` `description:` verbatim
- **agents / skills:** each file's native `description:` frontmatter (`.agent.md` / `SKILL.md`)
- **control-plane:** generator constants (AGENTS.md, `copilot-instructions.md`, `project-workflow.instructions.md`, `dev-flow-visualization.html`)

Layer-level freshness = `AGENTS.md` `last-verified`. Missing description → unit name + linkage note, never a hard fail. Do not retrofit the docs schema onto `.github/` files.

### Freshness rule

- `last-verified` > **6 weeks** → machine-derived `review` (docs/guides/KB class) at map generation.
- `last-verified` = **truth-check date** (when content was verified against code); the body footer **`Last Updated:`** = **last edit** (when prose changed).
- **Both bump in the same commit** as the edit/truth-check.
- A doc whose claims are now wrong bumps `last-verified` (it flips `review`); a doc whose claims were re-verified bumps both.

## Doc Change History & Business Docs

- **Git is the authoritative audit trail** — every doc edit is a Conventional Commit `docs(<scope>): …`; `Last Updated` is bumped in the same commit.
- **Decision-linked standing docs** (e.g., `docs/business/business-model.md`) MAY carry an in-doc **Change Log** (`Date | Change | Decision ID | Approval`) for owner-approved changes only; typos/formatting are git-only. Business research/reference (`docs/business/research/`) is freely editable with `Last Updated` + git only; supersede via banner, never rewrite cited evidence. Committed docs are the source of record and stand on their own — they must **never** mention the gitignored `wip/` working area (no citations, links, or history/provenance notes); `wip/` is a local working area only and is not part of the committed record.

---

**See also:** `project-workflow.instructions.md` (when doc updates happen in the pipeline) • `docs/templates/` (all templates) • `docs/knowledge-base/` (existing articles) • `docs/business/` (business model + research)

## Technical Challenges & Solutions Format

- **Challenge title**: Descriptive name (e.g., "Race Condition in Streak Updates")
- **Problem**: What went wrong or what obstacle was encountered
- **Root Cause**: Why the problem occurred (schema mismatch, wrong assumptions, etc.)
- **Solution**: How it was resolved (include code examples if relevant)
- **Impact/Benefits**: What improved or what was learned
- **Alternatives Considered**: Other approaches evaluated (optional)

Document challenges when:

- Debugging took >1 hour to resolve
- Test failures required significant refactoring
- Schema/API misalignment discovered
- Architectural pattern clarified through implementation
- Error handling strategy decided
- Performance issue identified and fixed

## Knowledge Base Extraction

After resolving non-trivial struggles (3+ hours debugging, infrastructure complexity, reusable patterns):

- **Actionable patterns** → `docs/guides/` — concise, directive format with numbered steps
- **Conceptual deep dives** → `docs/knowledge-base/` — detailed, educational format with tradeoff analysis
- **Cross-link** between story docs, guides, and KB articles
- **Remove verbose postmortems** from story implementation docs after extraction; keep doc focused on WHAT was built, not WHY/HOW in detail
- **Maintain template compliance** — after extraction, verify story/epic docs still match templates exactly
