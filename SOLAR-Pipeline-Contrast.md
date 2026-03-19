To implement a structured autonomous pipeline in 2026, you should define a **Pipeline Contract** within your orchestration layer (typically `AGENTS.md` or a specialized orchestrator agent profile). This architecture utilizes **Pipeline** patterns to pass work sequentially between specialized workers, using **Agent Hooks** to enforce strict state transitions and recursive loops.[1, 2]

### 1. Orchestrator Configuration (`.github/agents/orchestrator.agent.md`)

The orchestrator serves as the "Governor," managing high-level strategy and state while delegating tactical execution to specialized sub-agents.[3, 1]

```yaml
---
name: Orchestrator
description: Governance agent for high-autonomy task pipelines.
tools: ["agent", "terminal"]
agents: ["investigator", "architect", "frontend-auditor", "backend-auditor"]
hooks:
  stopHook: "./scripts/pipeline-governor.sh"
---
# Pipeline Contract: SOLAR-Ralph Standard
When mode is 'Pipeline', follow this strict sequence:

1. **Investigate**: Delegate to @investigator.
   - Criteria: Identify root cause. If "Simple", goto Step 3. If "Architectural", goto Step 2.
2. **Design**: Delegate to @architect.
   - Output: PRD_<NAME>.md + verified work packages.[4]
3. **Loop**: Invoke `/ralph-loop` with the work package.
   - Requirements: Set `Session-Type: loop` in `.ai_ledger.md`.[5]
4. **Review**: Delegate to @frontend-auditor and @backend-auditor.
   - Protocol: Adversarial auditing. Findings must trigger a jump back to Step 3.
5. **Close**: Update ledger to `WORK_PACKAGE_COMPLETE` and reset `Session-Type: chat`.
```

---

### 2. Technical Execution Layers

#### I. Investigation & Conditional Routing

The pipeline begins with a **Bug Investigation Specialist**. This specialist is tasked with identifying the "gradient" of the fix—whether it is a simple code correction or an architectural change.[6] If the investigator determines the fix is mechanical, it provides a "skip signal" to the Orchestrator to bypass the Design phase and proceed directly to implementation.[1]

#### II. The Recursive Loop Mechanism

Step 3 utilizes the **Ralph Wiggum Technique**. The orchestrator invokes the `/ralph-loop` command, which traps the agent in a self-referential cycle until a **Completion Promise** (e.g., `<promise>SUCCESS</promise>`) is written.

- **Backpressure Enforcement**: The loop is governed by "Backpressure"—strong checks like `npm test` or `build` commands that the agent must pass to escape the loop.[7, 8]
- **Ledger State**: During the loop, the system sets the `Session-Type: loop` in the repository's persistent ledger to prevent other agents from interrupting the write-heavy process.[5]

#### III. Adversarial Review & Repair

Instead of a standard review, the **Review** stage uses **Adversarial Auditors**. These agents are specifically prompted to find vulnerabilities or architectural drift that the worker might have "gamed" to pass tests.

- **Iteration Limit**: The contract specifies that findings trigger exactly one "Repair" iteration to maintain cost efficiency, returning the agent to Step 3.

#### IV. State Continuity & "Scar Tissue"

Persistence across these stages is managed via the **Mistake Ledger** (`.ai_ledger.md`) and **Copilot Memory**.[5, 9]

- **Cross-Session Persistence**: Lessons learned during a failed Loop iteration are stored as "memories" and validated against the codebase before the next iteration begins, preventing the agent from repeating the same error.[10, 5]
- **The Close Hook**: The pipeline only exits when the **Stop Hook** detects the final `WORK_PACKAGE_COMPLETE` token in the ledger. If the token is missing, the hook exits with **Exit Code 2**, forcing the session to re-inject the original prompt and continue the work.

### 3. Required Infrastructure File (`.github/hooks/hooks.json`)

To automate the "Stop Hook" behavior across the pipeline, configure the following lifecycle handlers:

```json
{
  "hooks": {
    "stopHook":
  }
}
```

The script `verify-completion.sh` checks the `.ai_ledger.md` file. If the state is not `COMPLETE`, it returns exit code 2 to keep the orchestrator active.
