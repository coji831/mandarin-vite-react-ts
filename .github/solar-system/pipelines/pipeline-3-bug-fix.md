# Pipeline 3: Bug Fix

**Signal:** "investigate and fix", "bug in X", unknown root cause, regression, multi-step fix

## Pipeline Stages

```
Governor
└─ 1. Bug Investigation Specialist
      ├─ simple root cause  → skip stage 2, go to stage 3
      └─ architectural root cause → stage 2
└─ 2. Design Planning Architect  [conditional: architectural only]
      └─ Output: decomposed work packages written to ledger
└─ 3. /ralph-loop  [Session-Type: loop]
      └─ Implementation Specialist + Test Specialist per iteration
└─ 4. Review Auditor (frontend and/or backend)
      ├─ Findings exist → one repair iteration back to stage 3
      └─ No findings → stage 5
└─ 5. Security Auditor  [conditional: only if auth/JWT/CORS/cookies touched]
└─ 6. Close  [Session-Type: chat, WORK_PACKAGE_COMPLETE]
```

## Log-Backpressure Gate

Before writing `WORK_PACKAGE_COMPLETE`, the governor MUST run the original reproduction script from stage 1 and confirm it no longer produces the error. Provide the passing log/output as evidence in the Completion Notes section of the ledger. A bug fix is NOT complete until the reproduction script passes.

## Stage Completion Criteria

**Stage 1 — Bug Investigation Specialist:**

- Output includes: failure location, root cause classification, evidence, reproduction script, recommended next agent

**Stage 2 — Design Planning Architect (conditional):**

- Inquiry Gate satisfied (files examined, ambiguities resolved, plan acknowledged)
- Output conforms to `solar-system/schemas/designer-output.schema.json`

**Stage 3 — Implementation Loop:**

- Each iteration ends with a narrowest-relevant verification run
- Ledger updated with step outcome after each iteration

**Stage 4 — Review Auditor:**

- Review findings are categorized by severity
- All CRITICAL findings resolved before advancing

**Stage 5 — Security Auditor (conditional: triggered if any `*route*`, `*auth*`, `*middleware*`, `*config*`, `*controller*`, `*permission*`, `*secret*`, `*credential*` file was touched):**

- Security findings addressed or explicitly escalated

**Stage 6 — Close:**

- Reproduction script passes
- All verification failures resolved
- Ledger completion promise set to `WORK_PACKAGE_COMPLETE`

## Mandatory Delegation Rules

| Signal                                                   | Required Agent                            | When                            |
| -------------------------------------------------------- | ----------------------------------------- | ------------------------------- |
| New story, epic, or feature                              | Design Planning Architect                 | BEFORE any implementation       |
| Bug with unknown root cause                              | Bug Investigation Specialist              | BEFORE any fix attempt          |
| Complex or architectural root cause (from investigation) | Design Planning Architect                 | AFTER investigation, BEFORE fix |
| Frontend code changes                                    | Frontend Implementation Specialist        | Always                          |
| Backend code changes                                     | Backend Implementation Specialist         | Always                          |
| Frontend changes complete                                | Frontend Review Auditor                   | BEFORE closure                  |
| Backend changes complete                                 | Backend Review Auditor                    | BEFORE closure                  |
| Auth, JWT, cookies, CORS, secrets, permissions touched   | Security Auditor                          | BEFORE closure                  |
| Redis, external HTTP client, TTL, retry, or cache work   | Cache and External Integration Specialist | Always                          |
| New logic or component                                   | Frontend or Backend Test Specialist       | Always                          |
| Doc or template changes                                  | Docs Curator                              | BEFORE closure                  |

## Verification Contract

No work package is complete until when relevant:

- Targeted tests pass
- Type or build checks pass for the affected lane
- Reviewer findings are either resolved or explicitly escalated
- Documentation impact is captured
- `.github/.ai_ledger.md` reflects the current state

When recording a failure in `.github/.ai_ledger.md`, always include all three fields:

```
- Verification Step: <what was checked>
- Failure: <what failed and the error output summary>
- Root Cause Hint: <why it failed + semantic direction for the fix>
```

## Recursive Refinement Contract

Each bounded loop follows:

1. Plan the next smallest meaningful step
2. Implement only that step
3. Verify with the narrowest relevant checks
4. Repair failures or record blockers
5. Repeat until one completion promise is true

Loop guardrails:

- Default maximum iterations per work package: `3`
- Escalate instead of looping if the same failure repeats without a new hypothesis
- Stop if the task requires policy, product, or external-system decisions not documented

## Stop Conditions

The agency may stop only when one of these is true:

- The active work package has a completion promise and no unresolved verification failures
- The ledger records a blocker with a concrete escalation reason
- The request is complete and all touched docs are synchronized
