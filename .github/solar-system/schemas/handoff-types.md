# Handoff Types Catalog

**Path:** `.github/solar-system/schemas/handoff-types.md`
**SOLAR Version:** v4 Phase 3
**Date:** 2026-04-04

---

## Purpose

Defines the catalog of typed handoff payload schemas used for structured inter-agent communication in SOLAR-Ralph pipelines. All payloads are instruction-enforced contracts — compliance is validated by the `subagent-stop.cjs` hook and the governor's step supervision checks, not by constrained decoding.

---

## Handoff Direction Overview

```
Governor  -->  Specialist     via: SubagentStart hook (Handoff Payload in ledger)
Specialist -->  Governor      via: implementer-handoff.schema.json
Scout     -->  Governor      via: scout_findings payload  (this catalog)
Developer -->  Reviewer      via: dev_progress payload    (this catalog)
Reviewer  -->  Governor      via: review_result payload   (this catalog)
Tester    -->  Governor      via: qa_result payload       (this catalog)
```

---

## Payload Types

### 1. `scout_findings`

**Produced by:** Bug Investigation Specialist, Design Planning Architect (research phase)
**Consumed by:** Orchestration Governor (to decide next pipeline stage)
**Schema file:** `scout-findings.schema.json`

**Required fields:**

```json
{
  "type": "scout_findings",
  "producedBy": "<agent name>",
  "producedAt": "<YYYY-MM-DD>",
  "workPackage": "<WP-id or task description>",
  "findingsSummary": "<one paragraph summary>",
  "filesExamined": ["<path>", "..."],
  "rootCauseClassification": "simple | architectural | unknown",
  "recommendedNextAgent": "<agent name>",
  "recommendedNextAction": "<brief directive>"
}
```

---

### 2. `dev_progress`

**Produced by:** Implementation Specialist, Backend Implementation Specialist, Frontend Implementation Specialist, Cache and External Integration Specialist
**Consumed by:** Orchestration Governor, Review Auditor
**Schema file:** `dev-progress.schema.json`

**Required fields:**

```json
{
  "type": "dev_progress",
  "producedBy": "<agent name>",
  "producedAt": "<YYYY-MM-DD>",
  "workPackage": "<WP-id>",
  "status": "completed | partial | blocked",
  "filesModified": ["<path>", "..."],
  "testsRan": true,
  "testsPassed": true,
  "blockersIfAny": "<none | description>",
  "recommendedNextAgent": "<Reviewer or governor>"
}
```

---

### 3. `review_result`

**Produced by:** Backend Review Auditor, Frontend Review Auditor
**Consumed by:** Orchestration Governor (to decide repair loop vs advance)
**Schema file:** `review-result.schema.json`

**Required fields:**

```json
{
  "type": "review_result",
  "producedBy": "<agent name>",
  "producedAt": "<YYYY-MM-DD>",
  "workPackage": "<WP-id>",
  "verdict": "pass | fail | conditional-pass",
  "findingsBySeverity": {
    "critical": [],
    "high": [],
    "medium": [],
    "low": []
  },
  "codingGamingCheck": "clean | findings",
  "residualRisk": "<none | description>",
  "recommendedNextAgent": "<governor | Implementation Specialist>"
}
```

---

### 4. `qa_result`

**Produced by:** Backend Test Specialist, Frontend Test Specialist
**Consumed by:** Orchestration Governor (to gate pipeline advancement past test stage)
**Schema file:** `qa-result.schema.json`

**Required fields:**

```json
{
  "type": "qa_result",
  "producedBy": "<agent name>",
  "producedAt": "<YYYY-MM-DD>",
  "workPackage": "<WP-id>",
  "testCommand": "<exact command run>",
  "totalTests": 0,
  "passed": 0,
  "failed": 0,
  "skipped": 0,
  "verdict": "pass | fail",
  "failureSummary": "<none | error output summary>",
  "recommendedNextAgent": "<governor | Implementation Specialist>"
}
```

---

## Schema Enforcement Notes

- All payloads are validated by `subagent-stop.cjs` via string-pattern matching on minimum required field names.
- Full schema validation per individual `.schema.json` files is instruction-enforced only (VS Code Copilot does not support constrained decoding).
- The `subagent-start.cjs` hook injects the current `Handoff Payload:` ledger section as `additionalContext` at delegation start.
- The governor writes the outbound payload into the `Handoff Payload:` section of `.ai_ledger.md` before delegating to a specialist.

---

## Adding New Payload Types

1. Define the new type in this file under its own `###` section.
2. Create a corresponding `{type}.schema.json` in this directory.
3. Add a handler case to `subagent-stop.cjs` if the new type has unique required fields.
4. Update `handoff-types.md` with the schema reference.
