# Copilot Instructions for AI Coding Agents

Operational playbook for AI agents contributing to `[YOUR-REPO-NAME]`.

> **Setup:** Fill in every `[POST-IMPLEMENT]` block. SOLAR-Ralph sections are ready to use as-is.

## ⚡ Quick Start

<!-- [POST-IMPLEMENT] -->

Install: `[install command]` | Dev: `[dev command]` | Tests: `[test command]`

## 🏗️ Architecture

<!-- [POST-IMPLEMENT: tech stack, folder layout, state, routing, auth] -->

**Frontend**: [stack + feature folder]
**Backend**: [stack + folder]
**State**: [approach] | **Data**: [DB/ORM] | **Auth**: [auth approach]

## 🔄 Workflows

<!-- [POST-IMPLEMENT: workflow summaries + links to detailed guides] -->

Development: [local dev flow] | Testing: [framework + command] | Deployment: [targets]

### 🤖 SOLAR-Ralph Operating Overlay

When work is executed through the repo's SOLAR-Ralph files, treat the current workflow above as the governing delivery path and the SOLAR files as the execution overlay.

- Orchestration contract: `AGENTS.md`
- Restart-safe ledger: `.ai_ledger.md`
- Lifecycle hooks: `.github/hooks/hooks.json`
- Path-specific instructions: `apps/frontend/.instructions.md`, `apps/backend/.instructions.md`
- Operator guides: `docs/guides/solar-ralph-workflow.md`, `docs/guides/agent-operations-guide.md`, `docs/guides/memory-governance-guide.md`

Working rules:

- Keep active execution state in `.ai_ledger.md`.
- Keep concise persistent facts in `/memories/repo/`.
- Keep durable guidance in `docs/`.
- Use bounded recursive repair loops with explicit completion promises instead of open-ended retry.
- Route frontend, backend, security, review, and documentation work through their matching specialist roles when the SOLAR overlay is active.

### 🧪 Task-Level Development Workflow

Follow this sequence for every task (feature, bug fix, or enhancement):

1. **Review** — Confirm AC clarity; resolve ambiguities before coding.
2. **Plan** — Identify impacted areas; check `docs/architecture.md` for conflicts.
3. **Implement** — Keep scope bound to AC; defer extras to a follow-up task.
4. **Test** — Cover happy path + at least one edge case; isolate unit tests for new logic.
5. **Run Locally** — Verify manually; capture any AC discrepancies.
6. **Docs** — Record decisions, data shape changes, performance notes.
7. **Pre-Commit Gate** — Tests pass; type check & lint clean.
8. **Commit** — `<type>(<scope>): <summary>`; include doc updates in same commit.

If blocked: pause and record the blocker with a concrete escalation reason in `.ai_ledger.md`.

## 🏷️ Naming & Structure

<!-- [POST-IMPLEMENT: naming conventions for files, functions, tests, branches] -->

## 🧪 Testing

<!-- [POST-IMPLEMENT: framework, coverage requirements, query conventions] -->

## 📝 Documentation Standards

<!-- [POST-IMPLEMENT: doc types, content requirements, style guide] -->

## 🛠️ Code Change Checklist

<!-- [POST-IMPLEMENT: checklist items] -->

## 🌿 Git & Branching

<!-- [POST-IMPLEMENT: branch naming convention] -->

## ✅ Closing Work Items

<!-- [POST-IMPLEMENT: closing criteria, PR requirements] -->

## 🧷 Quality Gates

- [ ] Tests passing
- [ ] Type check clean
- [ ] Lint clean
- [ ] Docs updated
- [ ] All AC complete or documented exception

## 📁 Key Files

<!-- [POST-IMPLEMENT: key files, architectural docs, workflow guides, code conventions, testing guidelines] -->

SOLAR Workflow: `docs/guides/solar-ralph-workflow.md`
Agent Operations: `docs/guides/agent-operations-guide.md`
Memory Governance: `docs/guides/memory-governance-guide.md`

---

If any section is unclear or missing — ask for clarification before proceeding.
