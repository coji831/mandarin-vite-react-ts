# Effort Simulation

Defines how SOLAR-Ralph simulates effort levels for agent delegation since VS Code
Copilot does not expose a `thinking_budget_tokens` or `effort:` API parameter to
agent authors.

---

## Background and Constraint

Anthropic Claude models support extended thinking and effort control at the API
level, but VS Code Copilot does not expose these parameters in `.agent.md` front
matter. Effort simulation is therefore **instruction-level only** — the governor
injects a preamble into the delegation prompt that instructs the receiving agent how
much analysis depth to apply.

This is a behavioral convention, not an API enforcement. An agent may comply
shallowly while appearing to follow the effort level. This limitation is accepted as
a known constraint and documented here rather than treated as a blocking defect.

---

## Effort Level Definitions

| Level  | Intent                                          | Injected preamble (from governor)                                                                        |
| ------ | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| low    | Brief, targeted output; no optional analysis    | "Be concise. Produce only what is explicitly asked. Skip optional analysis."                             |
| medium | Default depth; standard thoroughness            | (no preamble — default behavior)                                                                         |
| high   | Deep analysis; surface failure modes and risks  | "Think through all edge cases and failure modes before acting. Document your reasoning."                 |
| max    | Exhaustive; all approaches evaluated before act | "Perform exhaustive analysis before acting. Consider all possible approaches and their tradeoffs first." |

---

## Encoding Mechanism — Option B (Resolved OD-5)

Effort assignments are **centralized in the governor's `effort_preamble_lookup` section** (`orchestration-governor.agent.md`). The governor reads the table directly — it does not read individual agent files to determine effort level.

This was initially encoded as an `<effort>` tag in each agent body, then refactored to the governor table for two reasons:

1. All effort tuning is now a single-file edit in the governor.
2. When VS Code native `tiers:` front matter lands (TD-3), migration is one file, not 9.

Each non-default agent body carries a one-line discoverability comment:

```
<!-- effort: high — see orchestration-governor.agent.md effort_preamble_lookup -->
```

**Governor behavior at delegation time:**

1. Look up the target agent name in the `effort_preamble_lookup` table (Step 1 table).
2. If the agent has no table entry: use `context.effort.default` from `solar.config.json`.
3. If `Session-Type: loop` is active: floor the effort at `context.effort.loopMode`
   (never go below the loop floor regardless of table assignment).
4. Prepend the mapped preamble from the Step 2 table to the delegation prompt.
5. If effort is `medium`: prepend nothing — medium is the silent default.

---

## Per-Agent Effort Assignments

Assignments live in `orchestration-governor.agent.md` `effort_preamble_lookup` — authoritative source. The table below is a read-only summary for reference.

| Agent                        | effort: field | Rationale                                                       |
| ---------------------------- | ------------- | --------------------------------------------------------------- |
| Design Planning Architect    | high          | Solution design requires thorough analysis before coding starts |
| Bug Investigation Specialist | high          | Root cause tracing requires deep investigation                  |
| Security Auditor             | high          | Security failures can cascade; thorough analysis is mandatory   |
| Backend Review Auditor       | high          | Regression and safety review requires edge case enumeration     |
| Frontend Review Auditor      | high          | Accessibility and rendering bugs require thorough inspection    |
| Release Readiness Specialist | high          | Go / No-Go gate must not be superficial                         |
| Docs Curator                 | low           | Documentation output is factual; brevity preferred              |
| Solar Bootstrap              | low           | Setup utility; explicit single-step actions; no analysis needed |
| Solar Scan Collector         | low           | Verbatim extraction only; analysis is explicitly excluded       |

Agents without an entry in the governor table use the `context.effort.default` value from
`solar.config.json` (default: `medium`):

- Implementation Specialist
- Backend Implementation Specialist
- Frontend Implementation Specialist
- Backend Test Specialist
- Frontend Test Specialist
- Cache and External Integration Specialist
- Orchestration Governor (coordinator, not executor — effort per-delegation)

---

## Known Constraints

1. **No API enforcement.** Effort simulation relies on prompt instructions; an agent
   may produce shallow output while appearing to follow preamble instructions.
   Observable signal: response quality and thoroughness. Accept this limitation.
2. **No thinking budget control.** VS Code Copilot does not expose extended thinking
   configuration to agent authors. Extended thinking activates automatically for
   Claude models when enabled in VS Code settings.
3. **Loop mode floor.** When `Session-Type: loop` is active, the effort floor is
   `context.effort.loopMode` (default: `high`). This cannot be lowered per-agent
   in loop sessions — all specialists receive at least the loop floor preamble.

---

_SOLAR-only — do not expose this file in project-facing instructions._
