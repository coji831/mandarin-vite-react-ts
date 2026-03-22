# SOLAR-Ralph Full Implementation Guideline

A complete reference for deploying SOLAR-Ralph in any repository. Items marked **[POST-IMPLEMENT]** contain repo-specific content that must be customized after the template files are copied. Items with no tag are universal and can be used as-is.

---

## What Is SOLAR-Ralph?

SOLAR-Ralph is a repo-native autonomous agent framework built on five pillars:

| Pillar           | What It Provides                                                       |
| ---------------- | ---------------------------------------------------------------------- |
| **S**pecialist   | Domain-specific agents for frontend, backend, testing, security, docs  |
| **O**rchestrator | Central governor that selects pipelines, delegates, and enforces gates |
| **L**edger       | Restart-safe work-state file; survival memory across sessions          |
| **A**dversarial  | Review auditors and security auditor with code-gaming detection        |
| **R**ecursive    | Bounded repair loops with escalation stop conditions                   |

---

## Minimum Viable Set (Phase 1 Core)

These 5 items are the absolute minimum to have a functioning SOLAR loop. Everything else layers on top.

| #   | File                                             | Purpose                                                                                                          | Tag                  |
| --- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- | -------------------- |
| 1   | `AGENTS.md`                                      | Hub-and-spoke orchestration contract: delegation matrix, 4 pipelines, session types, completion promise protocol |                      |
| 2   | `.ai_ledger.md`                                  | Restart-safe state file: work queue, blockers, verification failures with Root Cause Hint, completion notes      | **[POST-IMPLEMENT]** |
| 3   | `.github/hooks/hooks.json`                       | Lifecycle hooks: PostToolUse type-check backpressure, Stop hook with Session-Type awareness                      | **[POST-IMPLEMENT]** |
| 4   | `.github/agents/orchestration-governor.agent.md` | Central orchestrator: pipeline selection, step supervision, mandatory delegation matrix                          |                      |
| 5   | `.github/commands/ralph-loop.prompt.md`          | Bounded autonomous loop: writes Session-Type, reads VerificationTarget, enforces completion promise              |                      |

---

## Layer 1: Agent Roster

All agents live in `.github/agents/`. Each uses a specific model tier (see Model Policy section).

### Tier 1 — Free (GPT-5 mini)

| File                                             | Role                                                                           |
| ------------------------------------------------ | ------------------------------------------------------------------------------ |
| `orchestration-governor.agent.md`                | Pipeline router, delegation enforcer, step supervisor                          |
| `frontend-implementation-specialist.agent.md`    | React, TypeScript, context, reducers, routing, components **[POST-IMPLEMENT]** |
| `backend-implementation-specialist.agent.md`     | Express, Prisma, services, repositories, auth **[POST-IMPLEMENT]**             |
| `frontend-test-specialist.agent.md`              | Vitest, RTL, reducer, hook, component tests **[POST-IMPLEMENT]**               |
| `backend-test-specialist.agent.md`               | Backend service, repository, integration, Prisma tests **[POST-IMPLEMENT]**    |
| `docs-curator.agent.md`                          | Documentation and template compliance **[POST-IMPLEMENT]**                     |
| `bug-investigation-specialist.agent.md`          | Root-cause classification; writes repro script; uses Claude Haiku 4.5          |
| `cache-external-integration-specialist.agent.md` | Redis, external APIs, TTL, retry, circuit-breaker **[POST-IMPLEMENT]**         |

### Tier 2 — Reduced cost (GPT-4o)

| File                                    | Role                                                       |
| --------------------------------------- | ---------------------------------------------------------- |
| `frontend-review-auditor.agent.md`      | Adversarial frontend review with ARA code-gaming detection |
| `backend-review-auditor.agent.md`       | Adversarial backend review with ARA code-gaming detection  |
| `release-readiness-specialist.agent.md` | Go/No-Go gate before governor writes WORK_PACKAGE_COMPLETE |

### Tier 3 — Premium (Claude Sonnet 4.5)

| File                                 | Role                                                            |
| ------------------------------------ | --------------------------------------------------------------- |
| `design-planning-architect.agent.md` | Solution shaping, decomposition, spec-first artifact production |
| `security-auditor.agent.md`          | Auth, JWT, CORS, cookies, input validation, rate limiting       |

> **Note on [POST-IMPLEMENT] agents**: The implementation agents need to know your stack. Update the "Tech Stack" and "Constraints" sections to match your repo's language, framework, ORM, and test runner. The governance agents (governor, architect, auditors, security) are largely universal.

---

## Layer 2: Skill Library

All skills live in `.github/skills/<name>/SKILL.md`. Load with `#<skill-name>` or via the agent's skills list.

### Core Execution Skills

| Skill Folder                       | Purpose                                                                              | Tag |
| ---------------------------------- | ------------------------------------------------------------------------------------ | --- |
| `frontend-feature-implementation/` | Reflexion-cycle implementation: Responder → Evaluator → Revisor **[POST-IMPLEMENT]** |     |
| `backend-feature-implementation/`  | Same Reflexion cycle for backend **[POST-IMPLEMENT]**                                |     |
| `frontend-review/`                 | ARA 4-pattern gaming detector for frontend changes                                   |     |
| `backend-review/`                  | ARA 4-pattern gaming detector for backend changes                                    |     |
| `frontend-testing/`                | Vitest + RTL test procedures **[POST-IMPLEMENT]**                                    |     |
| `backend-testing/`                 | Jest/Vitest backend test procedures **[POST-IMPLEMENT]**                             |     |

### Process & Governance Skills

| Skill Folder             | Purpose                                                      | Tag |
| ------------------------ | ------------------------------------------------------------ | --- |
| `story-execution/`       | End-to-end: plan → implement → test → docs → review → ledger |     |
| `doc-sync/`              | Keeps BR, implementation docs, and KB synchronized           |     |
| `memory-curation/`       | Decides what belongs in repo memory vs ledger vs docs        |     |
| `memory-verification/`   | Validates stale `/memories/repo/` facts before applying      |     |
| `recursive-remediation/` | Bounded repair loops without scope creep                     |     |
| `release-governance/`    | 5-gate Go/No-Go check before pipeline closure                |     |

### Debug & Browser Skills

| Skill Folder                       | Purpose                                                           | Tag |
| ---------------------------------- | ----------------------------------------------------------------- | --- |
| `browser-reproduction/`            | Playwright MCP: navigate → snapshot → reproduce → Behavior Report |     |
| `external-integration-operations/` | Fetch MCP for API contracts; Puppeteer MCP for CDP/DOM inspection |     |

> **[POST-IMPLEMENT] skills**: The implementation and testing skills need their "Tech Stack" sections updated to match your project's conventions, test utilities, and file path patterns.

---

## Layer 3: Lifecycle Hooks

| File                       | Contents                                                                                                                                                                                         | Tag                  |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------- |
| `.github/hooks/hooks.json` | Three hooks: `PostToolUse` (type-check backpressure on writes in loop mode), `stopHook` (reads Session-Type from ledger; blocks only in `loop` mode), `errorOccurred` (ledger update on failure) | **[POST-IMPLEMENT]** |

**Customize**: Replace `npx tsc --noEmit` in PostToolUse with your stack's check command (e.g., `python -m mypy`, `dotnet build`, `cargo check`). The Session-Type logic and error hook are universal.

---

## Layer 4: Path-Specific Instructions

These scoped instruction files enforce lang/framework rules only within their directory, preventing "instruction leakage" across the full codebase.

| File                             | Scope Pattern                                        | Tag                  |
| -------------------------------- | ---------------------------------------------------- | -------------------- |
| `apps/frontend/.instructions.md` | `applyTo: "apps/frontend/**/*.{ts,tsx,css,scss,md}"` | **[POST-IMPLEMENT]** |
| `apps/backend/.instructions.md`  | `applyTo: "apps/backend/**/*.{ts,js,md}"`            | **[POST-IMPLEMENT]** |

**For other repos**: Create one `.instructions.md` per app/service boundary. Match `applyTo` to the folder glob. Fill in constraints specific to your stack (state management patterns, API conventions, forbidden patterns, etc.).

---

## Layer 5: Persistent Repo Memory

All memory files live in `/memories/repo/`. These are concise fact sheets reused across sessions. They **must be populated from scratch** for each new repo — never copy content from another repo.

| File                    | What to Put Here                                                | Tag                  |
| ----------------------- | --------------------------------------------------------------- | -------------------- |
| `commands.md`           | Verified build, test, lint, and dev server commands             | **[POST-IMPLEMENT]** |
| `architecture.md`       | High-level folder layout, stack choices, data flow summary      | **[POST-IMPLEMENT]** |
| `workflow-facts.md`     | Branch naming, commit conventions, PR process, doc update rules | **[POST-IMPLEMENT]** |
| `frontend-facts.md`     | Component patterns, routing approach, state management choices  | **[POST-IMPLEMENT]** |
| `backend-facts.md`      | API conventions, DB access patterns, auth mechanism             | **[POST-IMPLEMENT]** |
| `security-facts.md`     | Auth flow details, secret locations, known risk areas           | **[POST-IMPLEMENT]** |
| `verification-facts.md` | Test commands, type-check commands, known flaky areas           | **[POST-IMPLEMENT]** |

> **Tip**: On first use, have the Orchestration Governor populate these files by running a codebase exploration pass before any story work begins. Use the `memory-curation` skill to guide what belongs here.

---

## Layer 6: Commands

| File                                     | Purpose                                       | Tag |
| ---------------------------------------- | --------------------------------------------- | --- |
| `.github/commands/ralph-loop.prompt.md`  | Bounded autonomous story loop (`/ralph-loop`) |     |
| `.github/commands/audit-story.prompt.md` | Adversarial audit command (`/audit-story`)    |     |

These are universal — no customization needed. They reference ledger fields and agents that are already parameterized.

---

## Layer 7: Operator Guides

Reference documentation for humans operating the system.

| File                                      | Purpose                                        | Tag                  |
| ----------------------------------------- | ---------------------------------------------- | -------------------- |
| `docs/guides/solar-ralph-workflow.md`     | Maps SOLAR onto repo delivery workflow         | **[POST-IMPLEMENT]** |
| `docs/guides/agent-operations-guide.md`   | How to invoke agents, skills, and loops safely |                      |
| `docs/guides/memory-governance-guide.md`  | Memory vs ledger vs docs decision rules        |                      |
| `docs/guides/solar-ralph-rollout-plan.md` | Phase tracking document                        | **[POST-IMPLEMENT]** |

---

## Layer 8: Knowledge Base Articles

These are generic reference articles that require no customization. Copy as-is.

| File                                                   | Content                                                   |
| ------------------------------------------------------ | --------------------------------------------------------- |
| `docs/knowledge-base/agent-orchestration-patterns.md`  | Hub-and-spoke design rationale and alternatives           |
| `docs/knowledge-base/adversarial-auditing-patterns.md` | ARA, code-gaming detection, verification backpressure     |
| `docs/knowledge-base/recursive-refinement-patterns.md` | Ralph-loop design, completion promise protocol            |
| `docs/knowledge-base/agent-memory-governance.md`       | Ledger hygiene, memory lifetimes, stale-fact prevention   |
| `docs/knowledge-base/connected-agent-topologies.md`    | Hub-and-spoke vs DAG vs fan-out; topology decision record |
| `docs/knowledge-base/mcp-integration-patterns.md`      | MCP server selection, security patterns, decision table   |

---

## Layer 9: MCP Integration (Optional but Recommended)

Enables browser automation, API contract testing, and GitHub integration for agents.

| File                    | Contents                                            | Tag                  |
| ----------------------- | --------------------------------------------------- | -------------------- |
| `.vscode/mcp.json`      | 4 MCP servers: Playwright, GitHub, Puppeteer, Fetch | **[POST-IMPLEMENT]** |
| `.vscode/settings.json` | Copilot agent enable flag; Autopilot opt-in comment | **[POST-IMPLEMENT]** |

### MCP Server Reference Table

| Server       | npm Package                              | Agent Use Case                                                  |
| ------------ | ---------------------------------------- | --------------------------------------------------------------- |
| `playwright` | `@playwright/mcp@latest`                 | Browser automation, accessibility tree, console/network capture |
| `github`     | `@modelcontextprotocol/server-github`    | Issues, PRs, CI status, code search                             |
| `puppeteer`  | `@modelcontextprotocol/server-puppeteer` | CDP `evaluate`, DOM inspection, localStorage/sessionStorage     |
| `fetch`      | `mcp-fetch-server`                       | Stateless HTTP — API contract testing without a browser         |

**[POST-IMPLEMENT]**: Set `COPILOT_MCP_GITHUB_TOKEN` in VS Code secret storage. Remove servers not relevant to your stack. See `docs/guides/mcp-operations-guide.md` for full setup.

---

## Layer 10: Verification Artifacts Directory

| File                               | Purpose                                              | Tag |
| ---------------------------------- | ---------------------------------------------------- | --- |
| `verification-artifacts/README.md` | Naming conventions, retention policy, emission rules |     |
| `verification-artifacts/.gitkeep`  | Keeps directory tracked in git                       |     |

Files written here at runtime (e.g., `target-<slug>.json` from Design Planning Architect) are per-story and should not be committed unless explicitly needed for audit trails.

---

## Layer 11: Ledger State File

| File            | Purpose                                                                               | Tag                  |
| --------------- | ------------------------------------------------------------------------------------- | -------------------- |
| `.ai_ledger.md` | Active work queue, session type, blockers, verification failures, completion evidence | **[POST-IMPLEMENT]** |

Start with the template structure below. Do not copy content from another project's ledger.

```markdown
# AI Ledger

## Current Objective

- Pipeline: (none)
- Pipeline Stage: (none)
- Session-Type: chat
- VerificationTarget: (none)
- Completion Promise: pending

## Work Queue

(empty)

## Active Blockers

(none)

## Verification Failures

(none)

## Completion Notes

(none)
```

---

## Layer 12: Root Contract Files

| File                              | Purpose                                                                                               | Tag                  |
| --------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------- |
| `AGENTS.md`                       | Full orchestration contract: pipelines, delegation matrix, verification contract, completion promises |                      |
| `.github/copilot-instructions.md` | Instruction precedence, SOLAR operating references, loop guidance                                     | **[POST-IMPLEMENT]** |

**[POST-IMPLEMENT]** for `copilot-instructions.md`: Keep the SOLAR operating overlay section universal, but update the "Architecture Overview" and "Key Files & Directories" sections to match your repo structure.

---

## Phase 2 Enhancements (Apply After Core Is Stable)

These add quality, cost efficiency, and debug capability on top of the core SOLAR system.

| ID  | Item                                                          | Status                      | Notes                                                                                     |
| --- | ------------------------------------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------- |
| A5  | Step-Level Process Supervision                                | ✅ In governor              | Universal — no customization needed                                                       |
| A6  | ARA 2.0 — Hacker-Auditor Pairs                                | ⏭️ Phase 3                  | Add "Proxy Sovereignty" section to both review auditors                                   |
| A7  | Semantic Gradient Refinement                                  | ✅ In ledger + AGENTS.md    | Universal                                                                                 |
| A8  | Exploration SKILL.md for Bug Investigation                    | ⏭️ Phase 3                  | Create `.github/skills/exploration/SKILL.md`                                              |
| B5  | Bypass Approvals / Autopilot                                  | ✅ `.vscode/settings.json`  | **[POST-IMPLEMENT]** — uncomment `terminal.allowAutoExecute` per developer preference     |
| B6  | Parallel Execution via Isolated Worktrees                     | ⏭️ Phase 3                  | Requires Copilot parallel agent fan-out                                                   |
| B7  | Heuristic Context Rotation (Stream Parser)                    | ⏭️ Phase 3                  | Requires token-count hook API                                                             |
| B8  | JIT Skill Loading via Argument-Hint                           | ~Partial                    | `argumentHint` on skills; governor doesn't yet enforce stage-specific loading             |
| C5  | MCP Server Integration (Playwright, Puppeteer, Fetch, GitHub) | ✅ `.vscode/mcp.json`       | **[POST-IMPLEMENT]** — add GitHub token                                                   |
| C6  | Verification-as-Code (VaC) Artifacts                          | ~Partial                    | `verification-artifacts/` + spec-first mode; per-stage signed artifact automation pending |
| C7  | Gutter Detection and Escalation                               | ⏭️ Phase 3                  | Add same-error-3x hash tracking to Stop hook                                              |
| C8  | Path-Specific Instruction Globbing                            | ✅ `.instructions.md` files | **[POST-IMPLEMENT]** — update `applyTo` glob                                              |
| C9  | GitHub-hosted Copilot Memory                                  | non-file                    | Manual admin toggle: org/repo Settings → GitHub Copilot → Memory                          |

---

## Model Policy

Model assignment is based on **invocation frequency** to minimize cost.

| Tier    | Model                         | Rate  | Assigned Agents                                                                                                                  |
| ------- | ----------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------- |
| Free    | `GPT-5 mini (copilot)`        | 0x    | Governor, Frontend Impl, Backend Impl, Frontend Test, Backend Test, Docs Curator, Bug Investigation (uses Haiku 4.5), ralph-loop |
| Reduced | `GPT-4o (copilot)`            | 0.33x | Frontend Review Auditor, Backend Review Auditor, Release Readiness Specialist                                                    |
| Premium | `Claude Sonnet 4.5 (copilot)` | 1x    | Design Planning Architect, Security Auditor, audit-story                                                                         |

> **Bug Investigation Specialist** uses `Claude Haiku 4.5 (copilot)` — cheaper than premium but capable enough for code tracing without escalating to the premium architect.

**Validated model strings**: `"Claude Sonnet 4.5 (copilot)"`, `"GPT-5 mini (copilot)"`, `"GPT-4o (copilot)"`, `"Claude Haiku 4.5 (copilot)"`

---

## Applying to a New Repo — Step-by-Step

### Step 1: Copy Universal Files (no edits needed)

```
AGENTS.md
.github/agents/orchestration-governor.agent.md
.github/agents/design-planning-architect.agent.md
.github/agents/bug-investigation-specialist.agent.md
.github/agents/frontend-review-auditor.agent.md
.github/agents/backend-review-auditor.agent.md
.github/agents/release-readiness-specialist.agent.md
.github/agents/security-auditor.agent.md
.github/agents/docs-curator.agent.md
.github/commands/ralph-loop.prompt.md
.github/commands/audit-story.prompt.md
.github/skills/story-execution/SKILL.md
.github/skills/doc-sync/SKILL.md
.github/skills/memory-curation/SKILL.md
.github/skills/memory-verification/SKILL.md
.github/skills/recursive-remediation/SKILL.md
.github/skills/release-governance/SKILL.md
.github/skills/frontend-review/SKILL.md
.github/skills/backend-review/SKILL.md
.github/skills/browser-reproduction/SKILL.md
.github/skills/external-integration-operations/SKILL.md
verification-artifacts/README.md
verification-artifacts/.gitkeep
docs/knowledge-base/agent-orchestration-patterns.md
docs/knowledge-base/adversarial-auditing-patterns.md
docs/knowledge-base/recursive-refinement-patterns.md
docs/knowledge-base/agent-memory-governance.md
docs/knowledge-base/connected-agent-topologies.md
docs/knowledge-base/mcp-integration-patterns.md
docs/guides/agent-operations-guide.md
docs/guides/memory-governance-guide.md
```

### Step 2: Copy and Customize (POST-IMPLEMENT)

Customize these for your repo's stack, conventions, and folder layout:

| File                                                            | What to Customize                                                |
| --------------------------------------------------------------- | ---------------------------------------------------------------- |
| `.ai_ledger.md`                                                 | Start from the blank template above                              |
| `.github/hooks/hooks.json`                                      | Replace `tsc --noEmit` with your stack's type-check/lint command |
| `.github/copilot-instructions.md`                               | Update Architecture Overview, Key Files, and stack references    |
| `.github/agents/frontend-implementation-specialist.agent.md`    | Tech stack, conventions, test runner, forbidden patterns         |
| `.github/agents/backend-implementation-specialist.agent.md`     | ORM, API style, auth mechanism, DB driver                        |
| `.github/agents/frontend-test-specialist.agent.md`              | Test runner, assertion library, mock strategy                    |
| `.github/agents/backend-test-specialist.agent.md`               | Test runner, DB fixtures strategy, integration test approach     |
| `.github/agents/cache-external-integration-specialist.agent.md` | Cache technology (Redis/Memcached/other), TTL policy defaults    |
| `.github/skills/frontend-feature-implementation/SKILL.md`       | Tech-stack section, code patterns, file path conventions         |
| `.github/skills/backend-feature-implementation/SKILL.md`        | Same for backend                                                 |
| `.github/skills/frontend-testing/SKILL.md`                      | Test runner commands, helper setup patterns                      |
| `.github/skills/backend-testing/SKILL.md`                       | Same for backend                                                 |
| `apps/frontend/.instructions.md` (or equivalent)                | `applyTo` glob, component patterns, state rules                  |
| `apps/backend/.instructions.md` (or equivalent)                 | `applyTo` glob, API conventions, auth constraints                |
| `.vscode/mcp.json`                                              | Add/remove servers; set secret env var names                     |
| `.vscode/settings.json`                                         | Uncomment `terminal.allowAutoExecute` if preferred               |
| `docs/guides/solar-ralph-workflow.md`                           | Map to your repo's delivery process                              |
| `docs/guides/solar-ralph-rollout-plan.md`                       | Reset to track your repo's phase progress                        |

### Step 3: Populate Repo Memory

Create and fill each file in `/memories/repo/` by running the Orchestration Governor in `chat` mode with the prompt:

```
@Orchestration-Governor explore the codebase and populate /memories/repo/ with verified facts about architecture, commands, workflow, frontend, backend, security, and verification.
```

Files to create:

```
/memories/repo/commands.md
/memories/repo/architecture.md
/memories/repo/workflow-facts.md
/memories/repo/frontend-facts.md
/memories/repo/backend-facts.md
/memories/repo/security-facts.md
/memories/repo/verification-facts.md
```

### Step 4: Verify the Hook

Run the Stop hook manually to confirm Session-Type detection works:

```
echo "Session-Type: chat" > .ai_ledger.md
# Confirm stop hook exits silently without blocking
```

Then test loop mode:

```
# Set Session-Type: loop in .ai_ledger.md and confirm hook blocks exit until promise is written
```

### Step 5: Run a Smoke Test Story

Pick a trivial task (e.g., "add a README badge") and execute it with `/ralph-loop` to verify the full pipeline runs end to end: Governor → Specialist → Test → Review → Close.

---

## Complete File Inventory

```
# Root contracts
AGENTS.md
.ai_ledger.md                                          [POST-IMPLEMENT]

# Agent definitions
.github/agents/orchestration-governor.agent.md
.github/agents/design-planning-architect.agent.md
.github/agents/bug-investigation-specialist.agent.md
.github/agents/frontend-implementation-specialist.agent.md     [POST-IMPLEMENT]
.github/agents/frontend-review-auditor.agent.md
.github/agents/frontend-test-specialist.agent.md               [POST-IMPLEMENT]
.github/agents/backend-implementation-specialist.agent.md      [POST-IMPLEMENT]
.github/agents/backend-review-auditor.agent.md
.github/agents/backend-test-specialist.agent.md                [POST-IMPLEMENT]
.github/agents/security-auditor.agent.md
.github/agents/docs-curator.agent.md                           [POST-IMPLEMENT]
.github/agents/release-readiness-specialist.agent.md
.github/agents/cache-external-integration-specialist.agent.md  [POST-IMPLEMENT]

# Hooks
.github/hooks/hooks.json                               [POST-IMPLEMENT]

# Skills
.github/skills/frontend-feature-implementation/SKILL.md        [POST-IMPLEMENT]
.github/skills/frontend-review/SKILL.md
.github/skills/frontend-testing/SKILL.md                       [POST-IMPLEMENT]
.github/skills/backend-feature-implementation/SKILL.md         [POST-IMPLEMENT]
.github/skills/backend-review/SKILL.md
.github/skills/backend-testing/SKILL.md                        [POST-IMPLEMENT]
.github/skills/story-execution/SKILL.md
.github/skills/doc-sync/SKILL.md
.github/skills/memory-curation/SKILL.md
.github/skills/memory-verification/SKILL.md
.github/skills/recursive-remediation/SKILL.md
.github/skills/release-governance/SKILL.md
.github/skills/browser-reproduction/SKILL.md
.github/skills/external-integration-operations/SKILL.md

# Commands
.github/commands/ralph-loop.prompt.md
.github/commands/audit-story.prompt.md

# Path-specific instructions
apps/frontend/.instructions.md  (or <your-app>/.instructions.md) [POST-IMPLEMENT]
apps/backend/.instructions.md   (or <your-app>/.instructions.md) [POST-IMPLEMENT]

# Repo memory (all must be created fresh per repo)
/memories/repo/commands.md                            [POST-IMPLEMENT]
/memories/repo/architecture.md                        [POST-IMPLEMENT]
/memories/repo/workflow-facts.md                      [POST-IMPLEMENT]
/memories/repo/frontend-facts.md                      [POST-IMPLEMENT]
/memories/repo/backend-facts.md                       [POST-IMPLEMENT]
/memories/repo/security-facts.md                      [POST-IMPLEMENT]
/memories/repo/verification-facts.md                  [POST-IMPLEMENT]

# Copilot / IDE config
.github/copilot-instructions.md                       [POST-IMPLEMENT]
.vscode/mcp.json                                      [POST-IMPLEMENT]
.vscode/settings.json                                 [POST-IMPLEMENT]

# Verification artifacts directory
verification-artifacts/README.md
verification-artifacts/.gitkeep

# Operator guides
docs/guides/solar-ralph-workflow.md                   [POST-IMPLEMENT]
docs/guides/agent-operations-guide.md
docs/guides/memory-governance-guide.md
docs/guides/solar-ralph-rollout-plan.md               [POST-IMPLEMENT]
docs/guides/mcp-operations-guide.md

# Knowledge base
docs/knowledge-base/agent-orchestration-patterns.md
docs/knowledge-base/adversarial-auditing-patterns.md
docs/knowledge-base/recursive-refinement-patterns.md
docs/knowledge-base/agent-memory-governance.md
docs/knowledge-base/connected-agent-topologies.md
docs/knowledge-base/mcp-integration-patterns.md
```

**Total files: 49**
**Universal (copy as-is): 28**
**Post-implement (must customize): 21**

---

## Quick Reference: Session Types

| Session-Type  | Stop Hook Behavior                                   | When to Use                                  |
| ------------- | ---------------------------------------------------- | -------------------------------------------- |
| `chat`        | Exits cleanly; no blocking                           | Planning, single queries, knowledge lookups  |
| `loop`        | Blocks until `WORK_PACKAGE_COMPLETE` promise written | `/ralph-loop` autonomous execution           |
| `manual-test` | Exits silently; no message                           | Human drives app; agent observes and reports |

Set the active session type in `.ai_ledger.md`:

```
Session-Type: loop
```

---

## Quick Reference: Completion Promise

To close a work package, the governor writes one of these into `.ai_ledger.md → Completion Promise`:

| Promise                                    | Meaning                                    |
| ------------------------------------------ | ------------------------------------------ |
| `<promise>WORK_PACKAGE_COMPLETE</promise>` | All done, all verifications pass           |
| `<promise>WORK_PACKAGE_BLOCKED</promise>`  | External dependency; blocker documented    |
| `<promise>ESCALATION_REQUIRED</promise>`   | Exceeds agent scope; human decision needed |

---

## Quick Reference: Verification Failure Format

Every failure entry in the ledger **must** include all three fields:

```markdown
- Verification Step: <what was checked>
- Failure: <error output summary>
- Root Cause Hint: <which concept, abstraction, or data path to investigate next>
```

A bare "test failed" entry is not acceptable and will be flagged by step supervision.

---

## Phase 3 Roadmap (Not Yet Implemented)

| ID  | Item                                                            | Trigger Condition                                                  |
| --- | --------------------------------------------------------------- | ------------------------------------------------------------------ |
| A6  | ARA 2.0 — Hacker-Auditor Pairs with Proxy Sovereignty detection | When over-mocking becomes a recurring false-pass pattern           |
| A8  | Exploration SKILL.md for Bug Investigation                      | When investigation specialist frequently requests manual grep help |
| B6  | Parallel Execution via Isolated Git Worktrees                   | When Copilot runtime supports parallel agent fan-out               |
| B7  | Heuristic Context Rotation via Stream Parser                    | When a reliable byte/token-count hook API is available             |
| B8  | Enforced JIT Skill Loading in Governor                          | When context window cost becomes measurably significant            |
| C7  | Gutter Detection in Stop Hook                                   | When same-error loops are observed causing wasted iterations       |
| C9  | GitHub-hosted Copilot Memory                                    | When org admin enables Memory in GitHub Settings → Copilot         |
