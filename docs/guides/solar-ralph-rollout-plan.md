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

- [x] `.github/agents/orchestration-governor.agent.md` — Named orchestrator persona for epic intake, delegation, and closure.
- [x] `.github/agents/design-planning-architect.agent.md` — Premium design and planning agent for high-ambiguity solution shaping and decomposition.
- [x] `.github/agents/frontend-implementation-specialist.agent.md` — Frontend implementation specialist.
- [x] `.github/agents/frontend-review-auditor.agent.md` — Frontend adversarial reviewer.
- [x] `.github/agents/frontend-test-specialist.agent.md` — Frontend testing specialist.
- [x] `.github/agents/backend-implementation-specialist.agent.md` — Backend implementation specialist.
- [x] `.github/agents/backend-review-auditor.agent.md` — Backend adversarial reviewer.
- [x] `.github/agents/backend-test-specialist.agent.md` — Backend testing specialist.
- [x] `.github/agents/security-auditor.agent.md` — Cross-cutting security and risk specialist.
- [x] `.github/agents/docs-curator.agent.md` — Documentation and template compliance specialist.

### Skills

- [x] `.github/skills/frontend-feature-implementation/SKILL.md` — Frontend implementation procedure.
- [x] `.github/skills/frontend-review/SKILL.md` — Frontend adversarial review procedure.
- [x] `.github/skills/frontend-testing/SKILL.md` — Frontend testing procedure.
- [x] `.github/skills/backend-feature-implementation/SKILL.md` — Backend implementation procedure.
- [x] `.github/skills/backend-review/SKILL.md` — Backend adversarial review procedure.
- [x] `.github/skills/backend-testing/SKILL.md` — Backend testing procedure.
- [x] `.github/skills/story-execution/SKILL.md` — End-to-end story execution procedure.
- [x] `.github/skills/doc-sync/SKILL.md` — Documentation synchronization procedure.
- [x] `.github/skills/memory-curation/SKILL.md` — Memory-vs-docs governance procedure.
- [x] `.github/skills/recursive-remediation/SKILL.md` — Bounded retry and recursive repair procedure.

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

## Phase 2: Defer

### External Integration and Platform Overhead

- [ ] `.vscode/mcp.json` — MCP integration configuration.
- [ ] `docs/guides/mcp-operations-guide.md` — MCP operational guidance.
- [ ] `docs/knowledge-base/mcp-integration-patterns.md` — MCP rationale and patterns.
- [ ] `docs/knowledge-base/connected-agent-topologies.md` — Cross-team or enterprise agent topology guidance.

### Additional Agents and Skills

- [ ] `.github/skills/external-integration-operations/SKILL.md` — External platform operations procedure.
- [ ] `.github/skills/release-governance/SKILL.md` — Release-readiness governance procedure.
- [ ] `.github/agents/release-readiness-specialist.agent.md` — Release-readiness specialist.
- [ ] `.github/agents/cache-external-integration-specialist.agent.md` — Cache and external integration specialist.

### Finer-Grained Instruction Layers

- [ ] `apps/frontend/src/features/**/.instructions.md` — Feature-level frontend instructions where needed.
- [ ] `apps/backend/src/**/.instructions.md` — Feature-level or layer-level backend instructions where needed.

### Additional Operator Surfaces

- [x] `.github/commands/ralph-loop.prompt.md` — **Promoted to Phase 1.** Dedicated bounded loop prompt for autonomous unattended story execution.
- [x] `.github/commands/audit-story.prompt.md` — **Promoted to Phase 1.** Dedicated adversarial audit prompt for structured story challenge and sign-off.
- [ ] `verification-artifacts/README.md` — Verification artifact conventions and retention rules.
- [ ] `verification-artifacts/.gitkeep` — Artifact directory placeholder.

## Non-File Follow-Up Work

These items are important for long-term parity with the research, but they are not solved by file creation alone.

- [ ] Enable and curate GitHub-hosted Copilot Memory in repository or organization settings.
- [ ] Define MCP secret governance for `COPILOT_MCP_*` variables if MCP is enabled later.
- [ ] Decide whether connected agents or external Copilot Studio topology is needed after the first pilot.

## Approval Notes

This plan intentionally prioritizes structural SOLAR coverage over enterprise completeness. Phase 1 is considered successful when the repository has usable Specialist, Orchestrator, Ledger, Adversarial, and Recursive behaviors with bounded scope and auditable outputs.
