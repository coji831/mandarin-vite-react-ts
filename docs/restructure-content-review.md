# Guides Restructure — Content Integrity Review

**Created:** June 7, 2026
**Purpose:** Per-file checklist to verify content integrity between old (pre-restructure) and new (post-restructure) file locations.
**Total files:** 34 on disk (14 direct moves + 7 moved-with-edits + 3 split files → 21 new paths + 5 new content + 2 redirects)

---

## Legend

| Transformation   | Meaning                                                           |
| ---------------- | ----------------------------------------------------------------- |
| **Moved**        | File renamed + relocated; content should be identical             |
| **Split**        | Old file's content distributed across multiple new files          |
| **Consolidated** | Old file absorbed content from other files (became authoritative) |
| **Extracted**    | Old file had sections pulled out into a new dedicated file        |
| **Rewritten**    | New file has substantially different content from old             |
| **Redirect**     | Stub file pointing to the new location                            |
| **New**          | Brand new file with no old counterpart                            |

---

## Category A: Direct Moves (content-identical — VERIFIED June 8, 2026)

These files were renamed + relocated. Content was verified via `git diff --no-index` between HEAD (old path) and working tree (new path).

**Key finding:** Only 6 of 14 files are content-identical (✅). The rest have varying degrees of changes — from minor additions (⚠️) to major restructuring (❌). Several files received Phase 4/5 additions ("When to read this", "Verification" sections) that were applied alongside the rename. The review doc's "Moved" transformation label should be updated for affected entries.

| #   | Old Path                                      | New Path                                      | Transformation    | ✅ Content Match | Notes                                                                                                             |
| --- | --------------------------------------------- | --------------------------------------------- | ----------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------- |
| 1   | `docs/guides/quickstart.md`                   | `docs/guides/getting-started/quickstart.md`   | Moved             | ❌               | **Mislabeled**: old quickstart.md → `project-overview.md` (R); `getting-started/quickstart.md` is NEW content (A) |
| 2   | `docs/guides/README.md`                       | `docs/guides/getting-started/README.md`       | Moved + Rewritten | ⚠️               | 111+ / 98−. Rewritten per Story 7.1 (expected)                                                                    |
| 3   | `docs/guides/linting-setup-guide.md`          | `docs/guides/setup/linting.md`                | Moved             | ⚠️               | Added "When to read this" + "Verification" sections                                                               |
| 4   | `docs/guides/vite-setup-guide.md`             | `docs/guides/setup/vite.md`                   | Moved             | ❌               | 53+ / 132−. Major restructure: encoding fix, cookie section simplified, cross-refs updated                        |
| 5   | `docs/guides/backend-conventions.md`          | `docs/guides/conventions/backend.md`          | Moved             | ❌               | 361+ / 166−. Major content consolidation (Phase 2)                                                                |
| 6   | `docs/guides/state-management-patterns.md`    | `docs/guides/conventions/state-management.md` | Moved             | ✅               | 9+ / 7−. Minor date/format only                                                                                   |
| 7   | `docs/guides/git-convention.md`               | `docs/guides/conventions/git.md`              | Moved             | ⚠️               | 186+ / 101−. Substantial content restructuring                                                                    |
| 8   | `docs/guides/frontend-testing-guide.md`       | `docs/guides/testing/frontend.md`             | Moved             | ✅               | 10+ / 9−. Minor changes                                                                                           |
| 9   | `docs/guides/backend-testing-guide.md`        | `docs/guides/testing/backend.md`              | Moved             | ✅               | 8+ / 8−. Minor changes                                                                                            |
| 10  | `docs/guides/gemini-api-integration-guide.md` | `docs/guides/integrations/gemini-api.md`      | Moved             | ✅               | 17+ / 21−. Date bump per Story 0.5.1                                                                              |
| 11  | `docs/guides/workflow.md`                     | `docs/guides/operations/workflow.md`          | Moved             | ✅               | 59+ / 60−. Minor restructuring, content preserved                                                                 |
| 12  | `docs/guides/review-checklist.md`             | `docs/guides/operations/review-checklist.md`  | Moved             | ❌               | 167+ / 206−. Substantial content changes                                                                          |
| 13  | `docs/guides/troubleshooting.md`              | `docs/guides/operations/troubleshooting.md`   | Moved             | ❌               | 314+ / 697− (net -383). Major restructuring                                                                       |
| 14  | `docs/deployment-guide.md`                    | `docs/guides/operations/deployment.md`        | Moved / Promoted  | ✅               | 20+ / 18−. Minor link path updates                                                                                |

**How to verify:**

```bash
# Example for one file:
git diff --no-index docs/guides/quickstart.md docs/guides/getting-started/quickstart.md
# If no output → content identical ✅
# If output → review changes are intentional (date bumps, link fixes)
```

---

## Category B: Moved with Minor Edits

These files were relocated AND had targeted edits per the plan. Verify old content survived + edits were applied correctly.

| #   | Old Path                                            | New Path                                           | Transformation       | ✅ Content Intact | ✅ Edits Applied | Expected Edits                                                                                                                          |
| --- | --------------------------------------------------- | -------------------------------------------------- | -------------------- | ----------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 14  | `docs/guides/environment-setup-guide.md`            | `docs/guides/getting-started/environment-setup.md` | Moved + Deduped      | ☐                 | ☐                | Story 2.1: Redis options removed → cross-ref; Story 0.5.4: date bump                                                                    |
| 15  | `docs/guides/frontend-development-guide.md`         | `docs/guides/setup/frontend-development.md`        | Moved                | ☐                 | ☐                | May have cross-ref updates for state-management.md                                                                                      |
| 16  | `docs/guides/database-setup-guide.md`               | `docs/guides/setup/database.md`                    | Moved + Consolidated | ☐                 | ☐                | Story 2.2: Absorbed DB commands from backend-dev + infra                                                                                |
| 17  | `docs/guides/backend-development-guide.md`          | `docs/guides/setup/backend-development.md`         | Moved + Extracted    | ☐                 | ☐                | Story 3.2: CORS/auth → cross-ref; security → security.md; DB → cross-ref; Redis → cross-ref; Testing → cross-ref; Story 0.5.5: date fix |
| 18  | `docs/guides/api-client-patterns.md`                | `docs/guides/conventions/api-client.md`            | Moved + Rewritten    | ☐                 | ☐                | Story 0.4: Removed ApiResponse\<T\> wrapper; Story 2.5: Error scoping → cross-ref                                                       |
| 19  | `docs/guides/infrastructure-setup-guide.md`         | `docs/guides/operations/infrastructure.md`         | Moved + Deduped      | ☐                 | ☐                | Story 2.2.3: DB migration → cross-ref to setup/database.md                                                                              |
| 20  | `docs/guides/frontend-backend-integration-guide.md` | `docs/guides/integrations/frontend-backend.md`     | Moved + Consolidated | ☐                 | ☐                | Story 2.3: Became authoritative for CORS + auth; Story 2.4.3: API client → cross-ref                                                    |

---

## Category C: Split Files

Old files whose content was distributed across multiple new locations.

### 21. `docs/guides/frontend-conventions.md` → Split into 3 destinations

| New Location                         | Content Responsibility                                                                                                                                                              | ✅ Content Preserved | Notes                                                                                    |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------- |
| `conventions/frontend.md`            | Code Style, Routing, Export Patterns, Import Paths, Testing Practices, CSV Format                                                                                                   | ✅                   | ~280 lines — correct content, cross-refs added                                           |
| `conventions/naming-standards.md`    | File & Folder Naming Standards tables                                                                                                                                               | ❌                   | **CRITICAL: Contains Backend Testing content instead (see C-1)**                         |
| _(removed sections, cross-ref only)_ | API Client → `api-client.md`, Backend → `backend.md`, State Mgmt → `state-management.md`, Auth → `integrations/frontend-backend.md`, Error Handling → `api-client.md`/`security.md` | ⚠️                   | Cross-refs present in `frontend.md`, but target files have wrong content (B-8, B-9, C-1) |

### 22. `docs/guides/backend-development-guide.md` → Split into 6 destinations

| New Location                       | Content Responsibility                                            | ✅ Content Preserved | Notes                                                                          |
| ---------------------------------- | ----------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------ |
| `setup/backend-development.md`     | Quick Start, Architecture Diagram, Express Setup, Common Commands | ❌                   | **CRITICAL: Has API Client content instead (see B-4)**                         |
| `conventions/security.md`          | Security standards (7 sections)                                   | ✅                   | Correct content, 9 sections, ~200 lines                                        |
| `integrations/frontend-backend.md` | CORS config, JWT flow, token refresh                              | ❌                   | **CRITICAL: Has Security content instead (see B-7, B-9)**                      |
| `setup/database.md`                | DB migration commands                                             | ☐                    | Not verified in this pass (Category C only)                                    |
| `setup/redis.md`                   | Redis caching setup                                               | ✅                   | Verified separately (see C-5)                                                  |
| `testing/backend.md`               | Testing patterns                                                  | ✅                   | Correct content (144 lines) — but also duplicated at naming-standards.md (C-1) |

### 23. `docs/guides/redis-setup-guide.md` → Split into 2 destinations

| New Location                     | Content Responsibility                                         | ✅ Content Preserved | Notes                                                               |
| -------------------------------- | -------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------- |
| `setup/redis.md`                 | TL;DR, Overview, Configuration & Setup, Env Vars, FAQ          | ✅                   | Options 1-4 merged from env-setup. Missing "Verification" (see C-5) |
| `operations/caching-patterns.md` | App-specific cache keys, invalidation, monitoring, performance | ✅                   | Correct content extracted. Missing "Last Updated" field (see C-6)   |

---

## Category D: New Files (No Old Counterpart)

| #   | New Path                              | Plan Reference  | ✅ Sections Present | Notes                                                                       |
| --- | ------------------------------------- | --------------- | ------------------- | --------------------------------------------------------------------------- |
| 24  | `getting-started/project-overview.md` | Story 4.1       | ☐                   | Tech stack, monorepo layout, key commands, reading path                     |
| 25  | `conventions/naming-standards.md`     | Story 3.1       | ❌ (see C-1)        | Frontend + backend naming tables — file has Backend Testing content instead |
| 26  | `conventions/security.md`             | Story 2.6 / 4.2 | ☐                   | All 7 security sections + frontend security logging                         |
| 27  | `operations/caching-patterns.md`      | Story 3.3       | ☐                   | Cache key formats, invalidation, monitoring, best practices                 |
| 28  | `setup/tooling-standards.md`          | Story 4.4       | ☐                   | ESLint, Prettier, TS config, Vitest, VS Code settings                       |
| 29  | `references/README.md`                | Story 4.3       | ☐                   | Central redirect landing page                                               |

---

## Category E: Redirect Stubs

| #   | Path                                 | Redirects To                                               | ✅ Link Correct | Notes |
| --- | ------------------------------------ | ---------------------------------------------------------- | --------------- | ----- |
| 30  | `references/backend-setup-guide.md`  | `../setup/backend-development.md`                          | ☐               |       |
| 31  | `references/testing-guide.md`        | `../testing/frontend.md` or `../testing/backend.md`        | ☐               |       |
| 32  | `references/code-conventions.md`     | `../conventions/backend.md` + `../conventions/frontend.md` | ☐               |       |
| 33  | `references/tooling-standards.md`    | `../setup/tooling-standards.md`                            | ☐               |       |
| 34  | `references/supabase-setup-guide.md` | `../setup/database.md`                                     | ☐               |       |

---

## Quick Executable Checks

### A1. Content-identity for direct moves (Category A)

```powershell
$moves = @(
  @{old="docs/guides/quickstart.md"; new="docs/guides/getting-started/quickstart.md"},
  @{old="docs/guides/linting-setup-guide.md"; new="docs/guides/setup/linting.md"},
  @{old="docs/guides/vite-setup-guide.md"; new="docs/guides/setup/vite.md"},
  @{old="docs/guides/backend-conventions.md"; new="docs/guides/conventions/backend.md"},
  @{old="docs/guides/state-management-patterns.md"; new="docs/guides/conventions/state-management.md"},
  @{old="docs/guides/git-convention.md"; new="docs/guides/conventions/git.md"},
  @{old="docs/guides/frontend-testing-guide.md"; new="docs/guides/testing/frontend.md"},
  @{old="docs/guides/backend-testing-guide.md"; new="docs/guides/testing/backend.md"},
  @{old="docs/guides/gemini-api-integration-guide.md"; new="docs/guides/integrations/gemini-api.md"},
  @{old="docs/guides/workflow.md"; new="docs/guides/operations/workflow.md"},
  @{old="docs/guides/review-checklist.md"; new="docs/guides/operations/review-checklist.md"},
  @{old="docs/guides/troubleshooting.md"; new="docs/guides/operations/troubleshooting.md"},
  @{old="docs/deployment-guide.md"; new="docs/guides/operations/deployment.md"}
)

foreach ($m in $moves) {
  $oldPath = Join-Path "C:\CodeProjects\Personal\mandarin-vite-react-ts" $m.old
  $newPath = Join-Path "C:\CodeProjects\Personal\mandarin-vite-react-ts" $m.new
  if ((Test-Path $oldPath) -and (Test-Path $newPath)) {
    $result = git diff --no-index --quiet $oldPath $newPath 2>&1
    if ($LASTEXITCODE -eq 0) { "✅ IDENTICAL: $($m.old)" }
    else { "⚠️  DIFFERS: $($m.old) — review changes" }
  } else {
    if (!(Test-Path $oldPath)) { "❌ MISSING OLD: $($m.old)" }
    if (!(Test-Path $newPath)) { "❌ MISSING NEW: $($m.new)" }
  }
}
```

### A2. Content-intact checks for edited files (Category B)

```powershell
# Check environment-setup still has env var table but NOT Redis options
$envSetup = "C:\CodeProjects\Personal\mandarin-vite-react-ts\docs\guides\getting-started\environment-setup.md"
Select-String -Path $envSetup -Pattern "Option [1-4]" -Quiet
# should be false (Redis options removed)

Select-String -Path $envSetup -Pattern "REDIS_URL|DATABASE_URL" -Quiet
# should be true (env vars preserved)

# Check backend-development no longer has full security sections
$backendDev = "C:\CodeProjects\Personal\mandarin-vite-react-ts\docs\guides\setup\backend-development.md"
Select-String -Path $backendDev -Pattern "Credential Management|Unsafe Defaults|Startup Validation|Input Validation|Rate Limiting|Security Headers|Audit Logging" -Quiet
# should be false (moved to security.md)
```

### B. Cross-reference integrity

```powershell
# Verify all redirect stubs point to real files
$redirects = @(
  "docs/guides/references/backend-setup-guide.md",
  "docs/guides/references/testing-guide.md",
  "docs/guides/references/code-conventions.md",
  "docs/guides/references/tooling-standards.md",
  "docs/guides/references/supabase-setup-guide.md"
)

foreach ($r in $redirects) {
  $path = Join-Path "C:\CodeProjects\Personal\mandarin-vite-react-ts" $r
  if (Test-Path $path) { "✅ EXISTS: $r" } else { "❌ MISSING: $r" }
}
```

### C. New file existence check

```powershell
$newFiles = @(
  "docs/guides/getting-started/project-overview.md",
  "docs/guides/conventions/naming-standards.md",
  "docs/guides/conventions/security.md",
  "docs/guides/operations/caching-patterns.md",
  "docs/guides/references/README.md"
)

foreach ($f in $newFiles) {
  $path = Join-Path "C:\CodeProjects\Personal\mandarin-vite-react-ts" $f
  if (Test-Path $path) {
    $lines = (Get-Content $path | Measure-Object -Line).Lines
    "✅ EXISTS ($lines lines): $f"
  } else { "❌ MISSING: $f" }
}
```

---

## Issues Log

| #    | File                                                                         | Issue                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Severity | Fixed?          |
| ---- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------- |
| A-1  | `quickstart.md`                                                              | Listed as "Moved" to `getting-started/quickstart.md`, but old file was actually renamed to `getting-started/project-overview.md` (R). The new `getting-started/quickstart.md` is completely new content (A), not a move. Review doc transformation label is incorrect.                                                                                                                                                                                                                                                                                                           | Medium   | ☐               |
| A-2  | `README.md`                                                                  | Listed as "Moved + Rewritten" ✅ — 111 insertions, 98 deletions. Consistent with Story 7.1.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Info     | ☐               |
| A-3  | `linting-setup-guide.md`                                                     | Listed as "Moved" (content-identical), but has additions: "When to read this" section and "Verification" section (Phase 5 format standardization). Should be "Moved + Edits".                                                                                                                                                                                                                                                                                                                                                                                                    | Low      | ☐               |
| A-4  | `vite-setup-guide.md`                                                        | Listed as "Moved" (content-identical), but has 53 insertions, 132 deletions — significant restructuring: fixed garbled Unicode, simplified cookie section with cross-ref, added "When to read this". Should be "Moved + Rewritten".                                                                                                                                                                                                                                                                                                                                              | Medium   | ☐               |
| A-5  | `backend-conventions.md`                                                     | Listed as "Moved" (content-identical), but has 361 insertions, 166 deletions — major content additions (likely consolidated from Phase 2). Not detected as rename by git. Transformation label incorrect.                                                                                                                                                                                                                                                                                                                                                                        | High     | ☐               |
| A-6  | `state-management-patterns.md`                                               | ✅ Expected "Moved"/identical — git detected rename, only 9 insertions/7 deletions (minor date/format). Acceptable.                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Info     | ☐               |
| A-7  | `git-convention.md`                                                          | Listed as "Moved" (content-identical), but has 186 insertions, 101 deletions — substantial content restructuring. Not detected as rename by git. Should be "Moved + Edits".                                                                                                                                                                                                                                                                                                                                                                                                      | Medium   | ☐               |
| A-8  | `frontend-testing-guide.md`                                                  | ✅ Expected "Moved"/identical — git detected rename, only 10 insertions/9 deletions (minor). Acceptable.                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Info     | ☐               |
| A-9  | `backend-testing-guide.md`                                                   | ✅ Expected "Moved"/identical — git detected rename, only 8 insertions/8 deletions (minor). Acceptable.                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Info     | ☐               |
| A-10 | `gemini-api-integration-guide.md`                                            | ✅ Expected "Moved"/identical — git detected rename, 17 insertions/21 deletions (date bump per Story 0.5.1). Acceptable.                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Info     | ☐               |
| A-11 | `workflow.md`                                                                | ✅ Expected "Moved"/identical — git detected rename, 59 insertions/60 deletions (minor restructuring). Acceptable.                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Info     | ☐               |
| A-12 | `review-checklist.md`                                                        | Listed as "Moved" (content-identical), but has 167 insertions, 206 deletions — substantial content changes. Not detected as rename by git. Should be "Moved + Edits".                                                                                                                                                                                                                                                                                                                                                                                                            | Medium   | ☐               |
| A-13 | `troubleshooting.md`                                                         | Listed as "Moved" (content-identical), but has 314 insertions, 697 deletions (net -383 lines) — major restructuring. Not detected as rename. Should be "Moved + Rewritten".                                                                                                                                                                                                                                                                                                                                                                                                      | High     | ☐               |
| A-14 | `deployment-guide.md`                                                        | ✅ Expected "Moved"/identical — git detected rename, 20 insertions/18 deletions (minor link path updates). Acceptable.                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Info     | ☐               |
| B-1  | `environment-setup-guide.md → getting-started/environment-setup.md`          | ✅ Redis options replaced with cross-ref to `setup/redis.md` (Story 2.1). ✅ "When to read this" added. ✅ "Verification" section added. ✅ Garbled Unicode fixed (tree characters). ❌ Last Updated not bumped (still June 3, 2026; Story 0.5.4 expected). OLD=351, NEW=456 lines. Should be "Moved + Rewritten".                                                                                                                                                                                                                                                               | Low      | ☐               |
| B-2  | `frontend-development-guide.md → setup/frontend-development.md`              | ❌ Title is "# Vite Setup Guide" instead of "# Frontend Development Guide" (wrong identity). ❌ No cross-ref to `state-management.md`. ❌ Missing "When to read this" and "Verification". OLD=384, NEW=226 lines. Old sections (Component Patterns, Routing, API) distributed to conventions files.                                                                                                                                                                                                                                                                              | Medium   | ☐               |
| B-3  | `database-setup-guide.md → setup/database.md`                                | ✅ Sections preserved (same headings). ✅ "When to read this" added. ✅ "Verification" added. ✅ DB commands preserved (absorbed per Story 2.2). ❌ Last Updated not bumped. OLD=357, NEW=370 lines.                                                                                                                                                                                                                                                                                                                                                                             | Low      | ☐               |
| B-4  | `backend-development-guide.md → setup/backend-development.md`                | ❌❌❌ **CRITICAL:** File has "# API Client & Integration Patterns" title — **WRONG CONTENT**. Contains API client patterns, not backend development. ❌ No "When to read this" or "Verification". ❌ No cross-refs to `security.md`, `database.md`, `redis.md`, `testing/backend.md`. ✅ Has CORS cross-ref to `frontend-backend.md`. OLD=517, NEW=264 lines.                                                                                                                                                                                                                   | Critical | ✅ Fixed June 8 |
| B-5  | `api-client-patterns.md → conventions/api-client.md`                         | ✅ Story 0.4: `ApiResponse<T>` removed; "Backend returns data directly" + double-unwrap warnings present. ✅ Test mocks updated (no wrapper). ✅ Story 2.5: Error scoping cross-ref to `backend.md`. ✅ "When to read this" added. ❌ No "Verification" section. ❌ Last Updated not bumped. OLD=290, NEW=259 lines.                                                                                                                                                                                                                                                             | Medium   | ☐               |
| B-6  | `infrastructure-setup-guide.md → operations/infrastructure.md`               | ✅ "When to read this" added. ✅ DB migration section replaced with cross-ref to `setup/database.md` (Story 2.2.3), quick ref kept. ❌ No "Verification" section. ❌ Last Updated not bumped. OLD=136, NEW=124 lines.                                                                                                                                                                                                                                                                                                                                                            | Low      | ☐               |
| B-7  | `frontend-backend-integration-guide.md → integrations/frontend-backend.md`   | **RESTORED** from git. ✅ Title correct. ✅ CORS/JWT/cookie auth content restored. ✅ API Client section replaced with cross-ref per Story 2.4.3. ✅ Old cross-refs updated to new paths. ❌ No "When to read this" or "Verification" (same as original).                                                                                                                                                                                                                                                                                                                        | Critical | ✅ Fixed June 8 |
| B-8  | Cross-wiring: `conventions/backend.md` ↔ `setup/tooling-standards.md`        | **RESTORED** from git. ✅ Now contains correct Backend Conventions & Architecture content. ✅ Cross-refs updated to new paths (backend-dev, database, api-client, workflow). `setup/tooling-standards.md` also correct (had correct content already).                                                                                                                                                                                                                                                                                                                            | Critical | ✅ Fixed June 8 |
| B-9  | Cross-wiring: `integrations/frontend-backend.md` ↔ `conventions/security.md` | **RESOLVED** by B-7 (frontend-backend restored from git). `conventions/security.md` now has all 9 sections completed.                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Critical | ✅ Fixed June 8 |
| C-1  | `conventions/naming-standards.md` (from frontend-conventions.md split)       | **RESTORED** from git. ✅ Now contains Naming Standards content extracted from old `frontend-conventions.md`. ✅ All 7 naming tables present (Backend, Frontend, Folder, Prefixes, Export, Test, Quick Reference). ✅ No testing content.                                                                                                                                                                                                                                                                                                                                        | Critical | ✅ Fixed June 8 |
| C-2  | `conventions/frontend.md` (from frontend-conventions.md split)               | ✅ Correct per Story 3.1. Contains: Code Style & Patterns, Routing, Export Patterns, Import Paths, Testing, CSV Format, Documentation Organization. API Client/Backend/State Mgmt/Security sections properly replaced with cross-refs. Includes "When to read this" section. [OLD=541 lines → NEW~280 lines at time of check]                                                                                                                                                                                                                                                    | Info     | ☐               |
| C-3  | Cross-wiring cascade: content swap chain                                     | The B-series cross-wiring extends: `conventions/naming-standards.md` has backend testing content (should be naming standards). `testing/backend.md` has correct backend testing content. This suggests a cascading swap: Backend Testing content overwrote Naming Standards. Related to B-8/B-9 pattern where multiple files have swapped identities.                                                                                                                                                                                                                            | Critical | ☐               |
| C-4  | `conventions/frontend.md` — cross-ref path accuracy                          | Cross-refs to `./api-client.md`, `./backend.md`, `./state-management.md`, `./security.md`, `./naming-standards.md` exist at correct paths. However: `./naming-standards.md` has wrong content (C-1), `./backend.md` has tooling content (B-8). Paths are correct but target files have swapped content.                                                                                                                                                                                                                                                                          | High     | ☐               |
| C-5  | `setup/redis.md` (from redis-setup-guide.md split)                           | ✅ Correct content. Title: "# Redis Setup Guide". Contains: TL;DR, Overview, Architecture diagram, Configuration Options (Options 1-4 merged from environment-setup-guide per Story 2.1), Env Vars table, FAQ. Cross-ref to `operations/caching-patterns.md`. Includes "When to read this". ❌ No "Verification" section (Phase 5.4). ❌ Last Updated not bumped. Old=303, NEW~200 lines.                                                                                                                                                                                        | Low      | ☐               |
| C-6  | `operations/caching-patterns.md` (from redis-setup-guide.md split)           | ✅ Correct content. Title: "# Caching Patterns & Strategies". Contains: Cache Key Format (TTS, Conversation, AI Feedback, Due Words, Quiz Session), Cache Invalidation (manual + auto), Monitoring, Performance Expectations, Load Testing, Best Practices. Cross-ref to `setup/redis.md`. ❌ Missing "Last Updated" field in metadata header; uses "Note:" admonition instead of standard "Audience:" field. **VERIFIED June 8: File actually has both "Last Updated: June 3, 2026" and "Audience:" field. C-6 finding may be stale — re-verify against current file content.** | Low      | ☐               |
| D-1  | `getting-started/project-overview.md` (Story 4.1 — new file)                 | **REWRITTEN** ✅ Now contains correct Project Overview content: tech stack, monorepo layout diagram, key commands table, where-to-put-code guide, reading path. No quickstart content remains.                                                                                                                                                                                                                                                                                                                                                                                   | Critical | ✅ Fixed June 8 |
| D-2  | `conventions/naming-standards.md` (Story 3.1 — new file, split target)       | **RESTORED** from git (see C-1). ✅ Now contains Naming Standards content.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Critical | ✅ Fixed June 8 |
| D-3  | `conventions/security.md` (Story 2.6 / 4.2 — new file)                       | **COMPLETED** ✅ All 9 sections now present (Credential Mgmt, No Unsafe Defaults, Startup Validation, Input Validation, Rate Limiting, Security Headers, Audit Logging, Security Logging Patterns, XSS/SQLi Prevention). File is 192 lines.                                                                                                                                                                                                                                                                                                                                      | High     | ✅ Fixed June 8 |
| D-4  | `setup/tooling-standards.md` (Story 4.4 — new file)                          | ✅ Content correct. ✅ "Last Updated" date fixed (July → June 8, 2026).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Low      | ✅ Fixed June 8 |
| D-5  | `references/README.md` (Story 4.3 — new file)                                | ✅ Correct structure. ✅ "Last Updated" date fixed (July → June 8, 2026).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Low      | ✅ Fixed June 8 |
| E-1  | `references/backend-setup-guide.md` (redirect stub)                          | ✅ Exists. ✅ Redirects to `../setup/backend-development.md`. Correct.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Info     | ☐               |
| E-2  | `references/testing-guide.md` (redirect stub)                                | ✅ Exists. ✅ Redirects to `../testing/frontend.md` or `../testing/backend.md`. Correct.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Info     | ☐               |
| E-3  | `references/code-conventions.md` (redirect stub)                             | ✅ Exists. ✅ Redirects to `../conventions/backend.md` or `../conventions/frontend.md`. Correct.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Info     | ☐               |
| E-4  | `references/tooling-standards.md` (redirect stub)                            | ✅ Exists. ✅ Redirects to `../setup/tooling-standards.md`. Correct.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Info     | ☐               |
| E-5  | `references/supabase-setup-guide.md` (redirect stub)                         | ✅ Exists. ✅ Redirects to `../setup/database.md` with section anchor (`#option-3-supabase-free-tier`). Includes KB cross-link to `backend-database-cloud.md`. More detailed than minimal stub — bonus content.                                                                                                                                                                                                                                                                                                                                                                  | Info     | ☐               |
