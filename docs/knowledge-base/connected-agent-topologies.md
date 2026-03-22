# Connected Agent Topologies

## What This Is

A reference for structuring multi-agent systems beyond the single-repository hub-and-spoke model. Covers how to compose agents across teams, repositories, or specializations when a single governor and a flat specialist pool are no longer sufficient.

## When to Use This

You need this when:

- Multiple teams need to share a specialist agent (e.g., a dedicated InfoSec team maintains a Security Auditor used by 10 product repos)
- A single epic spans multiple repositories and needs coordinated cross-repo state
- You want to compose independent sub-governors that each own a bounded domain

You do NOT need this when:

- Working inside a single repository with a single team
- Phase 1 hub-and-spoke is handling your workload without context exhaustion

---

## Topology Patterns

### 1. Hub-and-Spoke (Phase 1 — current)

```
   Orchestration Governor
    /       |       \
Frontend  Backend  Security
Specialist Specialist Auditor
```

- Single governor, flat specialist pool
- All agents in one repo under `.github/agents/`
- Works well for single-team, single-repo delivery

**When it breaks down:** Governor context exhaustion on long epics; specialist pool too large for governor to track accurately; multi-team coordination required.

---

### 2. Nested Governors (Sub-Orchestration)

```
     Root Governor
      /           \
FE Governor     BE Governor
  /     \         /      \
Impl   Test    Impl     Test
```

- Each domain (frontend, backend) gets its own governor
- Root governor delegates to domain governors, not to specialists directly
- Domain governors manage their own loop/review/closure
- Root governor only tracks cross-domain completion promises

**Best for:** Epics spanning frontend + backend with independent delivery cadence.

**Implementation:** Create `frontend-orchestration-governor.agent.md` and `backend-orchestration-governor.agent.md`. Root governor delegates entire lanes, not individual tasks.

---

### 3. Connected Agents (Cross-Repo Specialists)

```
Repo A Governor ──────→ Shared Security Auditor (Repo Z)
Repo B Governor ──────→ (maintained by InfoSec team)
Repo C Governor ──────→
```

- Specialist agents defined in a central repository
- Product repos reference them by name via `agent` tool invocation
- The shared agent has its own `.agent.md` with tools and model restrictions

**Best for:** Shared compliance or security specialists that must apply consistent standards across many repos.

**Limitation in Phase 1:** Not yet configured (requires establishing the shared agent repo and cross-repo agent references). Tracked as Phase 2.

---

### 4. Pipeline Topology (Sequential Handoff)

```
Investigation → Design → Implementation → Test → Review → Security → Docs → Close
```

- Strict linear handoff, each agent receives the previous agent's output as input
- No parallel execution — each stage must complete before the next begins
- This is the current Phase 1 Pipeline Contract in `AGENTS.md`

**When to upgrade:** When stages are truly independent (e.g., frontend tests and backend tests have no shared files) — fan-out to parallel reduces wall time.

---

### 5. Fan-Out / Gather (Parallel Execution)

```
         Governor
        /         \
Frontend          Backend
Implementation    Implementation
  ↓                  ↓
Frontend Test    Backend Test
        \         /
         Governor
         (gather)
```

- Governor dispatches parallel work packages to independent specialists
- Each specialist runs in an isolated context
- Governor collects results, resolves conflicts, advances the pipeline
- Reduces wall time significantly on large epics with independent lanes

**Phase 2 requirement:** Requires parallel agent invocation support in the Copilot runtime. Deferred until available.

---

## Choosing a Topology

| Signal                                             | Recommended Topology    |
| -------------------------------------------------- | ----------------------- |
| Single team, single repo                           | Hub-and-Spoke (Phase 1) |
| Epic spans both frontend and backend independently | Nested Governors        |
| Multiple repos need the same specialist            | Connected Agents        |
| Stages are independent and wall time matters       | Fan-Out / Gather        |
| Strict audit trail and compliance required         | Pipeline (sequential)   |

---

## Related

- `AGENTS.md` — current Phase 1 hub-and-spoke contract and pipeline definitions
- `docs/guides/agent-operations-guide.md` — how to invoke and delegate to agents
- `docs/knowledge-base/agent-orchestration-patterns.md` — hub-and-spoke rationale

---

## This Repository's Decision Record

**Decision Made:** March 2026
**Context:** SOLAR-Ralph Phase 2 pilot in `mandarin-vite-react-ts`.

### Current Topology: Hub-and-Spoke (Phase 1)

This repository uses the hub-and-spoke model (Topology 1). A single Orchestration Governor delegates to a flat pool of specialists, all defined in `.github/agents/`. This covers all current delivery needs — single team, single repository, sequential pipeline contracts.

### Why Not Copilot Studio Topology

- Single active contributor — no cross-team specialist sharing required.
- All specialists are lightweight enough for in-repo `.agent.md` files.
- Copilot Studio requires organizational-level configuration and adds operational overhead not justified at current scale.

### Why Not Connected Agents (Cross-Repo)

- No second repository yet needs to share the Security Auditor or Design Planning Architect.
- All agent contracts are self-contained in this repo's `.github/agents/` directory.

### Revisit Criteria

Upgrade the topology when ANY of these conditions become true:

- Team grows beyond 3 active contributors.
- A second repository needs to reuse the Security Auditor or Design Planning Architect.
- A single epic requires parallel frontend and backend pipelines running simultaneously (→ Fan-Out / Gather).
- Governor context exhaustion is observed on long multi-story epics (→ Nested Governors).
