---
name: docs-creation-with-design-gate
description: Documentation creation workflow that gates on design clarity before Docs Curator
status: inferred
source: ".github/copilot-instructions.md"
confidence: high
type: documentation-workflow
---

# Documentation Creation Workflow — Design Gate → Docs Curator

<scan_confidence>high</scan_confidence>

## Overview

This workflow ensures documentation is created with sufficient architectural clarity. If design context is ambiguous or incomplete, the flow gates through **Design Planning Architect** first before delegating to **Docs Curator** for document production.

## Auto-Loop Trigger Mechanism

**When:** Any review step (Auditor) returns findings (status ≠ PASS)

**Automatic Actions:**

1. System detects non-PASS review status
2. Captures all findings (blocking + high-severity) → handoff payload
3. Transitions ledger `Session-Type` → `loop`
4. Invokes `recursive-remediation` agent
5. Agent delegates rework loop (Curator fix → re-review → iterate)

**Loop Behavior:**

- **Max iterations:** 3 (Curator attempts to fix)
- **Exit on PASS:** All reviewers sign off → finalize (Phase 4)
- **Escalation at iteration 3:** If still failing → escalate to Design Planning Architect
- **User-free:** No prompt required; system proceeds autonomously

**Note:** This is NOT manual user decision-making. Loop triggers are configured in `.github/solar.config.json` under `hooks.onReviewFail`.

## Steps

### Phase 1: Design Clarity Assessment

1. **Evaluate Context Sufficiency**
   - Read existing BR files (if any) and implementation docs
   - Check `docs/architecture.md` for relevant patterns
   - List any ambiguous acceptance criteria, architectural unknowns, or design conflicts
   - Determine if design is **confident** (>80% clarity) or **uncertain** (<80% clarity)
   <!-- INJECT: phase-1-step-1 -->

2. **If Context Insufficient: Gate to Design Planning Architect**
   - **Trigger:** AC ambiguities exist, architecture conflicts detected, or design decisions unclear
   - **Delegation:** Invoke Design Planning Architect with:
     - Current BR stub (if exists)
     - List of specific ambiguities and unknowns
     - Request: "Validate and clarify design decisions before Docs Curator produces final docs"
   - **Wait for:** Design architect returns clarified architecture decisions + validated AC list
   - **Proceed to Phase 2 (Docs Curator)**
   <!-- INJECT: phase-1-step-2 -->

3. **If Context Sufficient: Skip to Phase 2**
   - **Trigger:** AC is clear, architecture is documented, no major unknowns
   - **Action:** Proceed directly to Docs Curator with high-confidence handoff payload
   - **Note:** Review step in Phase 3 provides quality gate; design review not needed upfront
   <!-- INJECT: phase-1-step-3 -->

### Phase 2: Docs Curator — Document Production

4. **Produce Business Requirements Documents**
   - Epic BR: `docs/business-requirements/epic-<num>-<slug>/README.md` (from epic template)
   - Story BRs: `docs/business-requirements/epic-<num>-<slug>/story-<num>-<num>-*.md` (×N stories, from story template)
   - Handoff payload includes:
     - Clarified AC list (from design phase or pre-validated)
     - Architecture decisions and rationale
     - Story dependency map
     <!-- INJECT: phase-2-step-1 -->

5. **Produce Implementation Documents**
   - Epic implementation: `docs/issue-implementation/epic-<num>-<slug>/README.md` (from epic impl template)
   - Story implementations: `docs/issue-implementation/epic-<num>-<slug>/story-<num>-<num>-*.md` (×N stories, from story impl template)
   - Include technical scope, component relationships, testing strategy
   <!-- INJECT: phase-2-step-2 -->

6. **Cross-Link Documents**
   - Epic BR links to all story BRs
   - Story BRs link back to epic BR
   - Epic implementation links to all story implementations
   - Story implementations link back to epic implementation
   - Update Related Issues sections bidirectionally
   <!-- INJECT: phase-2-step-3 -->

### Phase 3: Scope-Dependent Review Routing

7. **Identify Epic/Story Scope**
   - Scan all story BRs and implementation docs
   - Classify scope domains: architecture, backend, frontend, security, performance
   - Determine primary reviewers (may be multiple agents)
   <!-- INJECT: phase-3-step-1 -->

8. **Route to Appropriate Reviewer(s)**

   **If architecture decisions are primary:**
   - Delegate to **Design Planning Architect**
   - Verify architectural patterns, trade-offs, system design soundness
   - Check that decisions align with existing `docs/architecture.md`

   **If backend-heavy (services, APIs, database, caching, infrastructure):**
   - Delegate to **Backend Review Auditor**
   - Verify technical scope, implementation patterns, test coverage
   - Check API contracts, cache strategy, database schema decisions

   **If frontend-heavy (UI components, state, routing, client integration):**
   - Delegate to **Frontend Review Auditor**
   - Verify component architecture, accessibility, performance targets (e.g., 500ms load time)
   - Check state management patterns, test coverage with RTL

   **If security-related (auth, API keys, data handling, validation, permissions):**
   - Delegate to **Security Auditor**
   - Verify credential handling (env vars, service account scopes)
   - Check input validation, rate limiting, data sanitization
   - Validate HSK checks, secret redaction in logs

   **Note:** Complex epics may require **multiple agents in sequence** (e.g., Backend Auditor → Security Auditor → Frontend Auditor)
   <!-- INJECT: phase-3-step-2 -->

9. **Review Checklist (All Agents)**
   - [ ] All required sections present (no deletions or rearrangements)
   - [ ] Headings match template exactly (case-sensitive)
   - [ ] AC is testable and actionable
   - [ ] AC maps to at least one story
   - [ ] Cross-links are bidirectional and valid
   - [ ] Status fields are consistent (all "Planned" or all "In Progress")
   - [ ] Last Update dates match
   - [ ] Architecture/backend/frontend/security decisions justified
   <!-- INJECT: phase-3-step-3 -->

10. **Review Decision Outcomes + Auto-Loop Trigger**
    - **If all checks pass:** Sign off → proceed to finalization (Phase 4)
    - **If failures found:** **AUTOMATICALLY invoke `/ralph-loop` for Phase 3.5** (do NOT wait for user decision)
      - System detects review status ≠ PASS
      - Captures findings (blocking + high-severity) to handoff payload
      - Switches `Session-Type: loop` in ledger
      - Invokes recursive-remediation agent to delegate Docs Curator fix + re-review cycle
      <!-- INJECT: phase-3-step-4 -->

### Phase 3.5: Bounded Revision Loop

When review produces findings (blocking, high, or medium severity), automatically loop Docs Curator to fix without asking user.

11. **Classify Findings by Type**
    - **Blocking:** Specification gaps, missing AC clarity, undefined technical patterns (must fix before proceeding)
    - **High-severity:** Implementation ambiguities, incomplete error handling, vague metrics (should fix before implementation)
    - **Medium-severity:** Minor gaps, testing details, documentation improvements (nice to have but not blocking)
    - **Critical architectural issues:** Only escalate if reviewer flagged as "requires design rethink"
    <!-- INJECT: phase-3-5-step-1 -->

12. **Increment Iteration Counter**
    - Iteration 1 → 2 → 3 (max)
    - Track in `Session-Type: loop` ledger entry
    - Handoff payload includes: prior iteration count, findings summary, rework scope
    <!-- INJECT: phase-3-5-step-2 -->

13. **Determine Next Action**
    - **If iteration < 3:** Re-delegate to **Docs Curator** with structured rework scope:
      - Copy blocking + high-severity findings from prior review
      - Provide specific AC/section names to clarify
      - Request: "Address findings (blocking + high-severity) and resubmit for review"
      - Loop back to reviewer (Phase 3, step 8) with updated docs
    - **If iteration = 3 and still failing:** Escalate to **Design Planning Architect**
      - Signal: "Docs curator unable to resolve after 3 iterations; design clarity issue suspected"
      - Architect validates or clarifies design before next curator pass
    - **If iteration > 3:** Mark as BLOCKED; escalate to product/leadership for decision
    <!-- INJECT: phase-3-5-step-3 -->

### Phase 4: Finalization

14. **Approval & Completion** (after Phase 3.5 loop exits with PASS)
    - Reviewer approves final docs
    - Docs Curator sets Status: `Planned`
    - Update Last Update: current date
    - Record final iteration count in completion notes
    - All documents ready for implementation workflow
      <!-- INJECT: phase-4-step-1 -->
      <!-- INJECT: phase-3-step-4 -->

### Phase 4: Approval & Completion

11. **Final Sign-Off**
    - All reviewers sign off
    - Docs Curator updates Status fields: `Status: Planned`
    - Set Last Update date to current date
    - All documents ready for implementation workflow
    <!-- INJECT: phase-4-step-1 -->

<!-- INJECT: append-steps -->

---

## Scope-Dependent Review Routing Decision Tree

```
Phase 3: Identify Scope
    ↓
[Scan stories for dominant domains: architecture, backend, frontend, security]
    ↓
├─ Architecture-primary?
│   └─ → Design Planning Architect
│
├─ Backend-heavy (APIs, services, caching, infra)?
│   └─ → Backend Review Auditor
│
├─ Frontend-heavy (components, state, routing)?
│   └─ → Frontend Review Auditor
│
└─ Security-sensitive (auth, keys, validation, data)?
    └─ → Security Auditor

Note: Complex epics may route through multiple auditors in sequence.
Each reviewer runs Phase 3 checklist (steps 9-10) on their domain.
```

---

## Decision Tree: With vs. Without Design Gate

```
User requests: "Create docs for Epic X"
    ↓
[Assess context sufficiency]
    ├─ Insufficient? (AC ambiguous, arch unclear, conflicts found)
    │   └─ → Phase 1: Design Planning Architect (gate)
    │       ↓
    │       [Returns clarified design + validated AC]
    │       ↓
    │       → Phase 2: Docs Curator
    │       ↓
    │       → Phase 3: Scope-dependent review
    │           ├─ Architecture? → Design Planning Architect
    │           ├─ Backend? → Backend Review Auditor
    │           ├─ Frontend? → Frontend Review Auditor
    │           └─ Security? → Security Auditor
    │       ↓
    │       → Phase 4: Final sign-off
    │       ↓
    │       ✅ Docs complete
    │
    └─ Sufficient? (AC clear, arch decided, no conflicts)
        └─ → Phase 2: Docs Curator (direct)
            ↓
            → Phase 3: Scope-dependent review
                ├─ Architecture? → Design Planning Architect
                ├─ Backend? → Backend Review Auditor
                ├─ Frontend? → Frontend Review Auditor
                └─ Security? → Security Auditor
            ↓
            → Phase 4: Final sign-off
            ↓
            ✅ Docs complete
```

---

## Related Documentation

- [Docs Curator Agent](../../.github/AGENTS.md)
- [Design Planning Architect Agent](../../.github/AGENTS.md)
- [Backend Review Auditor Agent](../../.github/AGENTS.md)
- [Frontend Review Auditor Agent](../../.github/AGENTS.md)
- [Security Auditor Agent](../../.github/AGENTS.md)
- [Business Requirements Format Guide](../../docs/guides/business-requirements-format-guide.md)
- [Business Requirements Template](../../docs/templates/epic-business-requirements-template.md)
- [Implementation Template](../../docs/templates/epic-implementation-template.md)
