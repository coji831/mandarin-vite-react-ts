# SOLAR-Ralph Rollout Plan

This document tracks the repository rollout plan for a simplified but structurally faithful SOLAR-Ralph system.

## Goal

Establish a repo-native agent framework that includes all five SOLAR pillars in a usable first phase:

- Specialist coverage for both frontend and backend
- Orchestrator control through a central contract
- Ledger persistence through local memory and a restart-safe ledger file
- Adversarial review and verification gates
- Recursive refinement through bounded retry loops and stop conditions

## Tracking Rules

- Phase 1 items are required for the first usable SOLAR system in this repository.
- Phase 2 items are intentionally deferred because they add scale, external integration, or operational overhead rather than core SOLAR behavior.
- Existing repo documents that must be updated are tracked separately from newly created files.

## Phase 1: Create Now

### Core Orchestration and Ledger

- [x] `AGENTS.md` — Hub-and-spoke orchestration contract, delegation rules, handoffs, escalation, and completion promises.
- [x] `.ai_ledger.md` — Restart-safe ledger for work queue state, blockers, handoff outcomes, verification failures, and completion status.
- [x] `.github/hooks/hooks.json` — Simplified lifecycle hooks for adversarial checks, ledger updates, and recursive stop conditions.

### Frontend and Backend Agents

- [x] `.github/agents/orchestration-governor.agent.md` — Orchestrator with Pipeline Selection (4 pipelines), mode classification, step-level supervision gate, and mandatory delegation matrix.
- [x] `.github/agents/design-planning-architect.agent.md` — Premium design and planning agent for high-ambiguity solution shaping and decomposition.
- [x] `.github/agents/bug-investigation-specialist.agent.md` — Triage agent for bug root-cause classification (simple vs architectural); writes reproduction script before classifying.
- [x] `.github/agents/frontend-implementation-specialist.agent.md` — Frontend implementation specialist.
- [x] `.github/agents/frontend-review-auditor.agent.md` — Frontend adversarial reviewer with ARA code-gaming detection.
- [x] `.github/agents/frontend-test-specialist.agent.md` — Frontend testing specialist.
- [x] `.github/agents/backend-implementation-specialist.agent.md` — Backend implementation specialist.
- [x] `.github/agents/backend-review-auditor.agent.md` — Backend adversarial reviewer with ARA code-gaming detection.
- [x] `.github/agents/backend-test-specialist.agent.md` — Backend testing specialist.
- [x] `.github/agents/security-auditor.agent.md` — Cross-cutting security and risk specialist.
- [x] `.github/agents/docs-curator.agent.md` — Documentation and template compliance specialist.

### Skills

- [x] `.github/skills/frontend-feature-implementation/SKILL.md` — Frontend implementation procedure with Reflexion cycle (Responder → Evaluator → Revisor).
- [x] `.github/skills/frontend-review/SKILL.md` — Frontend adversarial review procedure with ARA code-gaming detection.
- [x] `.github/skills/frontend-testing/SKILL.md` — Frontend testing procedure.
- [x] `.github/skills/backend-feature-implementation/SKILL.md` — Backend implementation procedure with Reflexion cycle.
- [x] `.github/skills/backend-review/SKILL.md` — Backend adversarial review procedure with ARA code-gaming detection.
- [x] `.github/skills/backend-testing/SKILL.md` — Backend testing procedure.
- [x] `.github/skills/story-execution/SKILL.md` — End-to-end story execution procedure.
- [x] `.github/skills/doc-sync/SKILL.md` — Documentation synchronization procedure.
- [x] `.github/skills/memory-curation/SKILL.md` — Memory-vs-docs governance procedure.
- [x] `.github/skills/recursive-remediation/SKILL.md` — Bounded retry and recursive repair procedure.
- [x] `.github/skills/memory-verification/SKILL.md` — Just-in-time stale memory validation before applying cached facts.

### Path-Specific Instructions

- [x] `apps/frontend/.instructions.md` — Frontend constraints, patterns, boundaries, and precedence notes.
- [x] `apps/backend/.instructions.md` — Backend constraints, patterns, boundaries, and precedence notes.

### Persistent Repo Memory

- [x] `/memories/repo/commands.md` — Verified commands and execution entry points.
- [x] `/memories/repo/architecture.md` — Concise architecture facts for reuse across sessions.
- [x] `/memories/repo/workflow-facts.md` — Workflow and documentation rules.
- [x] `/memories/repo/frontend-facts.md` — Frontend-specific verified facts.
- [x] `/memories/repo/backend-facts.md` — Backend-specific verified facts.
- [x] `/memories/repo/security-facts.md` — Security-sensitive constraints and facts.
- [x] `/memories/repo/verification-facts.md` — Verification gates, commands, and review facts.

### Operator Guides

- [x] `docs/guides/solar-ralph-workflow.md` — Maps SOLAR onto the existing repo workflow.
- [x] `docs/guides/agent-operations-guide.md` — Explains how to invoke agents, skills, and recursive loops safely.
- [x] `docs/guides/memory-governance-guide.md` — Defines memory, ledger, and documentation boundaries.
- [x] `docs/guides/solar-ralph-rollout-plan.md` — This tracking document.

### Autonomous Loop Commands (Promoted from Phase 2)

- [x] `.github/commands/ralph-loop.prompt.md` — Bounded SOLAR Ralph loop for unattended autonomous story execution with completion promise enforcement.
- [x] `.github/commands/audit-story.prompt.md` — Adversarial audit command for structured story challenge, sign-off, and structured findings report.

### Knowledge Base

- [x] `docs/knowledge-base/agent-orchestration-patterns.md` — Hub-and-spoke design rationale.
- [x] `docs/knowledge-base/adversarial-auditing-patterns.md` — Verification backpressure rationale.
- [x] `docs/knowledge-base/recursive-refinement-patterns.md` — Ralph-style loop rationale.
- [x] `docs/knowledge-base/agent-memory-governance.md` — Ledger and memory hygiene rationale.

## Phase 1: Existing Files To Update

- [x] `.github/copilot-instructions.md` — Add SOLAR operating model references, precedence rules, and loop guidance.
- [x] `docs/automation/structured-ai-prompts.md` — Add agent-to-agent and loop prompt structures.
- [x] `docs/guides/review-checklist.md` — Add adversarial review and verification artifact expectations.
- [x] `docs/README.md` — Add navigation entry for SOLAR rollout and operating docs.

## Phase 1: Post-Baseline Enhancements

These were added after the initial Phase 1 build based on feedback and live testing.

### Pipeline Orchestration

- [x] `AGENTS.md` — Added 4 canonical Pipeline Contracts (Knowledge, Simple Fix, Bug Fix, Feature) and Session-Type reference table. Replaced advisory delegation rules with Mandatory Delegation Matrix.
- [x] `.github/agents/orchestration-governor.agent.md` — Added Pipeline Selection table, stage-tracking Approach, and Step-Level Process Supervision gate after each delegated stage.
- [x] `.ai_ledger.md` — Added `Session-Type` field (chat/loop/manual-test) and `Root Cause Hint` format to Verification Failures section.
- [x] `.github/hooks/hooks.json` — Stop hook now reads Session-Type: only enforces continuation in `loop` mode; silent on `chat` and `manual-test`; PostToolUse filtered to writes only with type-check backpressure.
- [x] `.github/commands/ralph-loop.prompt.md` — Added Session-Type write at loop start (loop) and on exit (chat). Post-loop review gate instruction added.

### Quality Enhancements (from SOLAR-Ralph-phase-1-feedback.md)

- [x] Reflexion cycles added to `frontend-feature-implementation/SKILL.md` and `backend-feature-implementation/SKILL.md` — Responder → Evaluator → Revisor inner loop before output.
- [x] ARA code-gaming detection added to both review auditor agents and both review skills — hunts for test modifications intended to bypass failures rather than fix them.
- [x] Step-Level Process Supervision added to `orchestration-governor.agent.md` — 4-point structural/logic/scope/gaming check before advancing pipeline stage.
- [x] Semantic Gradient enforced in `AGENTS.md` Verification Contract and `.ai_ledger.md` — failure entries must include Root Cause Hint, not just "failed".
- [x] Tiered model routing confirmed: `bug-investigation-specialist.agent.md` uses `Claude Haiku 4.5 (copilot)` with full exploration toolset.
- [x] Memory verification skill added: `.github/skills/memory-verification/SKILL.md` — validates stale `/memories/repo/` facts against current codebase before applying.
- [x] PostToolUse backpressure: hooks.json PostToolUse runs `tsc --noEmit` on writes in loop mode; errors injected as context backpressure.

### Debug and Testing (from SOLAR-Ralph-phase-1-feedback.md Section 4)

- [x] Reproduction Script Contract added to `bug-investigation-specialist.agent.md` — writes minimal curl/Vitest repro script and confirms failure before classifying root cause.
- [x] Log-Backpressure Gate added to `AGENTS.md` Pipeline 3 — WORK_PACKAGE_COMPLETE blocked until repro script passes and output logged in Completion Notes.
- [x] Session-Type: manual-test added to `AGENTS.md` and `.github/hooks/hooks.json` — Stop hook exits silently; human interacts, agent observes and reports findings without enforcing continuation.

## Phase 1: Required Simplifications

These are simplified implementations that still preserve the core SOLAR structure.

- Hooks may start with only `postToolUse`, `stopHook`, and `errorOccurred`.
- The ledger may begin as a single markdown file instead of a richer event stream.
- Recursive refinement may begin as one bounded Ralph-style loop contract rather than a broad command catalog.
- Persistent memory may begin with local `/memories/repo/` files even if GitHub-hosted Copilot Memory is not yet enabled.
- Adversarial outputs may begin as concise auditable summaries rather than a full artifact archive.

## Phase 1: Agent Model Policy

Model assignment is based on **frequency of invocation** to minimize total cost. Expensive models are reserved for roles that run rarely; free models absorb the high-volume workload.

| Tier                | Rate    | Model                         | Agents                                                                                                                                                                                 |
| ------------------- | ------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Free (0x)**       | No cost | `GPT-5 mini (copilot)`        | Orchestration Governor, Frontend Implementation Specialist, Backend Implementation Specialist, Frontend Test Specialist, Backend Test Specialist, Docs Curator, `ralph-loop.prompt.md` |
| **Average (0.33x)** | Reduced | `GPT-4o (copilot)`            | Frontend Review Auditor, Backend Review Auditor                                                                                                                                        |
| **Costly (1x)**     | Premium | `Claude Sonnet 4.5 (copilot)` | Design Planning Architect, Security Auditor, `audit-story.prompt.md`                                                                                                                   |

**Why frequency-first over performance-first:**

- High-frequency agents (governor, implementation, testing, docs) run on every story — keeping them free controls baseline cost.
- Medium-frequency agents (review auditors) run once per story at closure — a mid-tier model is sufficient for structured review checklists.
- Low-frequency agents (design architect, security auditor) run rarely — premium model cost is justified and total spend stays low due to infrequent invocation.

**Validated model strings (confirmed working):** `"Claude Sonnet 4.5 (copilot)"`, `"GPT-5 mini (copilot)"`, `"GPT-4o (copilot)"`

**Invalid (confirmed failing):** Array form `["model-a", "model-b"]`, `"GPT-5 (copilot)"`, `"GPT-5.2 (copilot)"`

## Phase 2: Enhancements (from SOLAR-Ralph-phase-2-feedback.md)

These items were addressed or formally evaluated based on the Phase 2 feedback review.

### Quality of Agent

- [x] **A5 Step-Level Process Supervision** — Already implemented in Phase 1 (see Phase 1 Post-Baseline Enhancements). Governor evaluates structural, logic-path, scope, and gaming checks after every delegated stage.
- [x] **A7 Semantic Gradient Refinement** — Already implemented in Phase 1 (A4). `.ai_ledger.md` and `AGENTS.md` mandate `Root Cause Hint` with concrete semantic direction; "gutter" language confirmed consistent with Verbal Reinforcement Learning framing.
- [ ] **A6 ARA 2.0 (Proxy Sovereignty / Hacker-Auditor Pairs)** — Deferred to Phase 3. Existing ARA 4-pattern detector covers core gaming; Proxy Sovereignty framing and explicit Hacker-Auditor pair prompt pattern not yet added to review auditor agents.
  > **Future:** Update `frontend-review-auditor.agent.md` and `backend-review-auditor.agent.md` to add a "Hacker-Auditor" role section that explicitly hunts for over-mocked dependencies masking architectural failures.
- [ ] **A8 Exploration Toolset for Investigators** — Deferred to Phase 3. `bug-investigation-specialist.agent.md` has `tools: [read, search, execute]` but no dedicated standalone Exploration SKILL.md with standardized grep/find/code-search step procedures.
  > **Future:** Create `.github/skills/exploration/SKILL.md` with step-by-step grep, find, and semantic-code-search procedures for the Bug Investigation Specialist.

### Minimize Cost

- [x] **B5 Bypass Approvals / Autopilot** — `.vscode/settings.json` configured with `"github.copilot.chat.agent.enabled": true`. Bypass approvals (`terminal.allowAutoExecute`) documented as a commented-out opt-in line ready to uncomment per developer preference. Pipeline 2 guidance references the setting.
- [ ] **B6 Parallel Execution via Isolated Worktrees** — Deferred to Phase 3. Requires parallel agent invocation support in the Copilot agent runtime. No `.ralph-worktrees/` topology implemented.
  > **Future:** When Copilot supports parallel agent fan-out, update Pipeline 4 (Feature) in `AGENTS.md` to route independent sub-tasks to isolated worktrees under `.ralph-worktrees/`.
- [ ] **B7 Heuristic Context Rotation (Stream Parser)** — Deferred to Phase 3. No reliable token-count hook API available. No `stream-parser.sh` byte-counting threshold mechanism implemented.
  > **Future:** Once a reliable byte/token-count hook is available, implement a threshold-based ledger save-and-restart contract at 80% capacity.
- [~] **B8 JIT Skill Loading via Argument-Hint** — Partial. `story-execution`, `recursive-remediation`, `memory-curation`, and `doc-sync` skills have `argumentHint` properties. Governor does not yet enforce JIT loading as a pipeline-stage requirement; all skills remain available contextually.
  > **Future:** Update the Governor Approach to explicitly call `/skill <name>` only for the current pipeline stage, deferring other skills.

### Code Quality

- [x] **C5 Chrome DevTools MCP Integration** — `.vscode/mcp.json` configured with 4 MCP servers: `@playwright/mcp` covers `browser_console_messages` and `browser_network_requests`; `@modelcontextprotocol/server-puppeteer` covers `puppeteer_evaluate` for CDP/JS inspection; `mcp-fetch-server` for stateless API contract testing; `@modelcontextprotocol/server-github` for issue/PR/CI status. `browser-reproduction/SKILL.md` and `external-integration-operations/SKILL.md` in place.
- [~] **C6 Verification-as-Code (VaC) Artifacts** — Partial. `verification-artifacts/` directory created with `README.md` (conventions, naming rules, retention policy) and `.gitkeep`. Design Planning Architect spec-first mode writes `verification-artifacts/target-<slug>.json`; `ralph-loop.prompt.md` enforces `VerificationTarget:` criteria. Per-stage tamper-evident signed artifact emission not yet automated.
  > **Future:** Define a `verification-artifacts/emit-artifact.js` helper and update each pipeline stage in `AGENTS.md` to call it with stage outputs.
- [ ] **C7 Gutter Detection and Escalation** — Deferred to Phase 3. `AGENTS.md` has a textual guardrail ("escalate if same failure repeats without a new hypothesis"). `hooks.json` Stop hook has no automated same-error-3x circular-failure detection.
  > **Future:** Add a gutter-detection node script to the Stop hook that tracks failure hashes in `.ai_ledger.md` and forces escalation when 3 identical failures are recorded.
- [x] **C8 Path-Specific Instruction Globbing** — `apps/frontend/.instructions.md` (`applyTo: "apps/frontend/**/*.{ts,tsx,css,scss,md}"`) and `apps/backend/.instructions.md` both exist with scoped `applyTo` patterns preventing instruction leakage.
- non-file **C9 Hybrid Persistence Strategy** — Local `/memories/repo/` active and in use. GitHub-hosted Copilot Memory requires manual admin toggle (org/repo settings → GitHub Copilot → Memory). Manual setup guide in the Non-File Follow-Up Work section below.

---

## Phase 2: Defer

### Browser & Runtime Debug Integration (MCP)

These require MCP server setup and external tooling configuration. See `SOLAR-Ralph-phase-1-feedback.md` Section 4 for full rationale.

- [x] `.vscode/mcp.json` — MCP integration configuration. Base file enabling all MCP servers below.
- [x] Chrome DevTools MCP — `evaluate_script` covered by Puppeteer MCP (`puppeteer_evaluate`); `list-console_messages` and `list_network_requests` covered by Playwright MCP (`browser_console_messages`, `browser_network_requests`). Both servers configured in `.vscode/mcp.json`.
- [x] Browser-Reproduction Skill — `.github/skills/browser-reproduction/SKILL.md` using `npx @playwright/mcp`; navigates URL, fills forms, returns Behavior Report with console errors.

- [ ] Real-Time Log Monitoring — MCP Chrome Spy server for live console event stream during manual testing. No validated public npm package confirmed; Playwright MCP `browser_console_messages` covers accumulated console output for most use cases.
  > **Future Consideration**: Not yet critical due to manual test frequency and existing Playwright MCP coverage, but valuable for high-frequency debugging sessions.
- [ ] Integrated Browser Debugging — VS Code `editor-browser` debug type (v1.112+); breakpoints and variable inspection in integrated browser.
  > **Future Consideration**: Not yet critical due to expected low frequency of deep debugging sessions and existing Playwright MCP coverage, but a powerful tool for complex frontend issues.
- [ ] Observability MCP Servers — Datadog/New Relic/Dynatrace 2026 MCP servers for live trace/log queries against staging or production.
  > **Future Consideration**: Valuable for post-deployment monitoring and debugging, but deferred until after core SOLAR behaviors are stable and cost predictable.

### Cost Optimization (Deferred from Feedback)

> **Future Consideration**: These optimizations add complexity and operational overhead that may not be justified until the system scales or incurs significant cost.

- [ ] Context Rotation Thresholds — No clean hook API for token count in Phase 1. Script to monitor token usage and force context-clear restart at 80% capacity.
- [ ] Topology-Specific Execution (DAG) — Governor analyzes task dependency graph; parallel fan-out for low-coupling tasks, sequential for high-coupling. Requires parallel agent invocation support.
- [ ] Just-in-Time Skill Loading — Load only the specific SKILL.md needed per pipeline stage instead of all skills. Requires reliable `/skill` command auto-loading.

### Code Quality (Deferred from Feedback)

- [x] Specification-First / Reverse Mode — Design Planning Architect produces a `verification-artifacts/target-<slug>.json` artifact in spec-first mode; `ralph-loop.prompt.md` reads `VerificationTarget:` from ledger and enforces all `successCriteria` before emitting completion promise.
- [x] `verification-artifacts/README.md` — Verification artifact conventions and retention rules.
- [x] `verification-artifacts/.gitkeep` — Artifact directory placeholder.

### External Integration and Platform Overhead

- [x] `docs/guides/mcp-operations-guide.md` — MCP operational guidance. Updated to document Playwright, GitHub, Puppeteer, and Fetch servers.
- [x] `docs/knowledge-base/mcp-integration-patterns.md` — MCP rationale and patterns. Covers when to use each server type, integration patterns for all 4 servers, and custom-hosting decision guide.
- [x] `docs/knowledge-base/connected-agent-topologies.md` — Cross-team or enterprise agent topology guidance.

### Additional Agents and Skills

- [x] `.github/skills/external-integration-operations/SKILL.md` — Fetch MCP (API contract testing) and Puppeteer MCP (DOM/storage inspection) procedures with Integration Verification Report output contract.
- [x] `.github/skills/release-governance/SKILL.md` — Release-readiness governance procedure.
- [x] `.github/agents/release-readiness-specialist.agent.md` — Release-readiness specialist.
- [x] `.github/agents/cache-external-integration-specialist.agent.md` — Cache and external integration specialist. Covers Redis key patterns, TTL policies, external HTTP client contracts, and retry/circuit-breaker patterns.

### Finer-Grained Instruction Layers

> **Future Consideration** — Feature-level instruction files add value only after feature folders grow complex enough that the top-level `.instructions.md` produces inconsistent agent behavior. Defer until at least 3 features have divergent enough conventions to warrant dedicated files.

- [ ] `apps/frontend/src/features/**/.instructions.md` — Feature-level frontend instructions where needed.
- [ ] `apps/backend/src/**/.instructions.md` — Feature-level or layer-level backend instructions where needed.

### Additional Operator Surfaces

- [x] `.github/commands/ralph-loop.prompt.md` — **Promoted to Phase 1.** Dedicated bounded loop prompt for autonomous unattended story execution.
- [x] `.github/commands/audit-story.prompt.md` — **Promoted to Phase 1.** Dedicated adversarial audit prompt for structured story challenge and sign-off.

## Non-File Follow-Up Work

These items are important for long-term parity with the research, but they are not solved by file creation alone.

- [ ] Enable and curate GitHub-hosted Copilot Memory in repository or organization settings.
  > **Manual Setup Guide:** Go to GitHub → Organization (or Repository) Settings → GitHub Copilot → Policies → ensure "Copilot in GitHub" is enabled. To enable Memory, navigate to Settings → Copilot → Features and toggle on "Copilot Memory" (organization admin required for org-level; repository admin for repo-level). In VS Code, open Copilot Chat and use `@copilot /memory list` to view stored memories and `/memory delete` to remove stale entries. Repository-scoped memories are already seeded in `/memories/repo/` — these are consumed by agents directly without requiring GitHub-hosted Memory to be enabled.
- [x] Define MCP secret governance for `COPILOT_MCP_*` variables — documented in `docs/guides/mcp-operations-guide.md` under "COPILOT*MCP*\* Naming Convention and Governance". Naming convention, scope rules, and addition workflow all defined.
- [x] Decide whether connected agents or external Copilot Studio topology is needed after the first pilot — decision recorded in `docs/knowledge-base/connected-agent-topologies.md` under "This Repository's Decision Record". Current decision: hub-and-spoke maintained; Copilot Studio and cross-repo agents deferred with explicit revisit criteria.
- [x] Enable Autopilot / Bypass Approvals flag in VS Code settings for Pipeline 2 (Simple Fix) — `.vscode/settings.json` updated with `"github.copilot.chat.agent.enabled": true` and the bypass setting documented as a commented-out line ready to uncomment per developer preference.

## Approval Notes

This plan intentionally prioritizes structural SOLAR coverage over enterprise completeness. Phase 1 is considered successful when the repository has usable Specialist, Orchestrator, Ledger, Adversarial, and Recursive behaviors with bounded scope and auditable outputs.
