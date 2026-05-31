# Pipeline 4: Feature

**Signal:** "implement", "add", "build", new feature, story, epic, "story-X"

## Pipeline Stages

```
Governor
└─ 1. Design Planning Architect
      └─ Output: decomposed work packages written to ledger
└─ 2. /ralph-loop  [Session-Type: loop]
      └─ Implementation Specialist + Test Specialist per iteration
└─ 3. Review Auditor (frontend and/or backend)
      ├─ Findings exist → one repair iteration back to stage 2
      └─ No findings → stage 4
└─ 4. Security Auditor  [conditional: only if auth/JWT/CORS/cookies touched]
└─ 5. Docs Curator
└─ 6. User Approval & Commit  [Session-Type: chat]
      └─ Governor presents summary, waits for user approval
      └─ On approval: Governor commits changes
      └─ On rejection: Return to previous stage for rework
└─ 7. Close  [Session-Type: chat, WORK_PACKAGE_COMPLETE]
```

## Stage Completion Criteria

**Stage 1 — Design Planning Architect:**

- Inquiry Gate satisfied (files examined, ambiguities resolved, plan acknowledged)
- Output conforms to `solar-system/schemas/designer-output.schema.json`
- Work packages written to ledger

**Stage 2 — Implementation Loop:**

- Each iteration ends with a narrowest-relevant verification run
- Ledger updated with step outcome after each iteration
- All Acceptance Criteria traced to test coverage

**Stage 3 — Review Auditor:**

- Review findings categorized by severity
- All CRITICAL findings resolved before advancing

**Stage 4 — Security Auditor (conditional: triggered if any `*route*`, `*auth*`, `*middleware*`, `*config*`, `*controller*`, `*permission*`, `*secret*`, `*credential*` file was touched):**

- Security findings addressed or explicitly escalated

**Stage 5 — Docs Curator:**

- Implementation doc updated
- Architecture doc updated if cross-cutting changes made
- API spec updated if endpoint contracts changed

**Stage 6 — User Approval & Commit:**

- Governor presents a final summary to the user with:
  - Work packages completed
  - All tests passing
  - All reviews approved
  - Files changed (git status)
- User approval required before proceeding
- On approval: commit staged changes with conventional commit message
- On rejection: rollback and return to appropriate earlier stage (3, 4, or 5)
- Commit must include reference to work package/story number and PR/issue link if applicable

**Stage 7 — Close:**

- All Acceptance Criteria verified
- No unresolved verification failures
- Ledger completion promise set to `WORK_PACKAGE_COMPLETE`

## Mandatory Delegation Rules

Refer to `pipeline-3-bug-fix.md` Mandatory Delegation Rules table — the same rules apply to Feature pipeline delegations.

## Verification Contract

Refer to `pipeline-3-bug-fix.md` Verification Contract — same rules apply.

## Recursive Refinement Contract

Refer to `pipeline-3-bug-fix.md` Recursive Refinement Contract — same rules apply.

## Stop Conditions

Refer to `pipeline-3-bug-fix.md` Stop Conditions — same rules apply.
