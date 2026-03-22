---
name: release-governance
description: >
  Use when verifying a feature pipeline is ready to close and release. Checks all
  lanes — tests passing, security audit complete, docs synced, ledger has no open
  blockers — and produces a Go / No-Go decision with evidence.
user-invocable: false
---

# Release Governance Skill

## Purpose

Run the release readiness gate before the governor may write `WORK_PACKAGE_COMPLETE` on a Pipeline 4 (Feature) or Pipeline 3 (Bug Fix) delivery.

This skill does NOT write the completion promise. It produces a Go / No-Go report. If **Go**, the governor proceeds to close. If **No-Go**, the governor must resolve all blockers before re-running.

---

## Approach

### Step 1 — Test Verification

1. Read the `.ai_ledger.md` "Verification Failures" section.
2. If any failures are listed without a resolution note, flag as **No-Go — open test failures**.
3. Search for the most recent test run evidence in `verification-artifacts/`. Verify file name matches the active epic/story.
4. Confirm the artifact contains zero failing tests.

### Step 2 — Security Audit Verification

1. Check whether the current epic or story touched auth, JWT, CORS, cookies, secrets, rate limiting, or permissions (read `AGENTS.md` Mandatory Delegation Matrix for the trigger list).
2. If yes, locate `verification-artifacts/security-findings-<epic>-<story>.*`.
3. If the file is missing and security-sensitive paths were changed, flag as **No-Go — security audit not run**.
4. If the file exists, check for unresolved CRITICAL or HIGH findings. Any open CRITICAL = **No-Go**.

### Step 3 — Documentation Verification

1. Check the story or epic implementation doc for:
   - `Status:` field present and set to a closed value (not `In Progress`).
   - `Last Update` date matches today's date or recent (within 1 day).
   - All Acceptance Criteria checkboxes are checked.
2. If any AC is unchecked and not marked `Deferred`, flag as **No-Go — incomplete acceptance criteria**.
3. Check `docs/architecture.md` only if the story implementation doc records a cross-cutting architectural change. If it does and `docs/architecture.md` was not updated, flag as **No-Go — architecture doc not updated**.

### Step 4 — Ledger Verification

1. Read `.ai_ledger.md` "Next Actions" and "Blockers" sections.
2. If any item is listed without a resolution note, flag as **No-Go — open ledger items**.
3. Confirm `Completion Promise:` field is still `pending` (not yet written — the governor writes it, not this skill).

### Step 5 — Produce Report

Format the report as:

```
## Release Readiness Report

Epic/Story: <epic-story identifier>
Date: <today's date>

### Verdict: Go ✅ / No-Go ❌

### Evidence

| Gate | Result | Notes |
|------|--------|-------|
| Tests passing | ✅ / ❌ | <artifact name or failure detail> |
| Security audit | ✅ / ❌ / N/A | <artifact name or reason skipped> |
| Docs synced | ✅ / ❌ | <which doc was missing or outdated> |
| AC complete | ✅ / ❌ | <which AC items are unchecked> |
| Ledger clear | ✅ / ❌ | <open items if any> |

### Blockers (if No-Go)

- <blocker 1>
- <blocker 2>
```

---

## Output Contract

- Return the formatted report to the governor.
- Do NOT write `WORK_PACKAGE_COMPLETE`.
- Do NOT modify `.ai_ledger.md`.
- Do NOT perform any code changes.

---

## Constraints

- Read-only. This skill reads artifacts and docs; it never writes code or modifies ledger state.
- No assumptions. If an artifact is absent and the gate requires it, flag as No-Go.
- Strict pass threshold. A single unresolved CRITICAL security finding or open AC item = No-Go regardless of other gates.
