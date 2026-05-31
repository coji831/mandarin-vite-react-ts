---
name: docs-creation-direct-curator
description: Documentation creation workflow that passes directly to Docs Curator when context is confident
status: inferred
source: ".github/copilot-instructions.md"
confidence: high
type: documentation-workflow
---

# Documentation Creation Workflow — Direct to Docs Curator (with Review Gate)

<scan_confidence>high</scan_confidence>

## Overview

When epic/story requirements are well-defined and architecture is confident (>80% clarity), this workflow bypasses design planning and goes directly to **Docs Curator** for document production, with a mandatory **review gate** as the quality safeguard before finalization.

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

### Phase 1: Confidence Check

1. **Verify Context Readiness**
   - Confirm AC list is complete and testable
   - Confirm architecture decisions are documented
   - Confirm story dependencies are clear
   - Confirm acceptance criteria maps to stories
   - Confidence threshold: >80% (minor ambiguities OK; major unknowns → use design-gate workflow instead)
   <!-- INJECT: phase-1-step-1 -->

2. **Prepare Handoff Payload**
   - Collect all pre-existing context (from BR stubs, architecture docs, team discussions)
   - Compile AC list (testable items)
   - Document architecture decisions with rationale
   - Create story dependency map
   - Flag any low-confidence items for reviewer to catch
   <!-- INJECT: phase-1-step-2 -->

### Phase 2: Docs Curator — Document Production

3. **Produce Business Requirements Documents**
   - Epic BR: `docs/business-requirements/epic-<num>-<slug>/README.md`
   - Story BRs (×N): `docs/business-requirements/epic-<num>-<slug>/story-<num>-<num>-*.md`
   - Use exact templates from `docs/templates/`
   - Populate with handoff payload context
   <!-- INJECT: phase-2-step-1 -->

4. **Produce Implementation Documents**
   - Epic implementation: `docs/issue-implementation/epic-<num>-<slug>/README.md`
   - Story implementations (×N): `docs/issue-implementation/epic-<num>-<slug>/story-<num>-<num>-*.md`
   - Include technical scope, testing strategy, architecture integration
   <!-- INJECT: phase-2-step-2 -->

5. **Cross-Link All Documents**
   - Epic BR ↔ all story BRs (bidirectional links)
   - Epic implementation ↔ all story implementations (bidirectional links)
   - BR ↔ implementation cross-references
   - Update Related Issues sections
   - Verify no broken links
   <!-- INJECT: phase-2-step-3 -->

### Phase 3: Scope-Dependent Review Routing

6. **Identify Epic/Story Scope**
   - Scan all story BRs and implementation docs
   - Classify scope domains: architecture, backend, frontend, security, performance
   - Determine primary reviewers (may be multiple agents)
   <!-- INJECT: phase-3-step-1 -->

7. **Route to Appropriate Reviewer(s)**

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

8. **Review Checklist (All Agents)**
   - [ ] All required sections present (no deletions or rearrangements)
   - [ ] Headings match template exactly (case-sensitive)
   - [ ] AC is testable and actionable
   - [ ] AC maps to at least one story
   - [ ] Cross-links are bidirectional and valid
   - [ ] Status fields are consistent (all "Planned" or all "In Progress")
   - [ ] Last Update dates match
   - [ ] Architecture/backend/frontend/security decisions justified
   <!-- INJECT: phase-3-step-3 -->

9. **Review Decision Outcomes + Auto-Loop Trigger**
   - **If all checks pass:** Sign off → proceed to finalization (Phase 4)
   - **If failures found:** **AUTOMATICALLY invoke `/ralph-loop` for Phase 3.5** (do NOT wait for user decision)
     - System detects review status ≠ PASS
     - Captures findings (blocking + high-severity) to handoff payload
     - Switches `Session-Type: loop` in ledger
     - Invokes recursive-remediation agent to delegate Docs Curator fix + re-review cycle
     <!-- INJECT: phase-3-step-4 -->

### Phase 3.5: Bounded Revision Loop

When review produces findings (blocking, high, or medium severity), automatically loop Docs Curator to fix without asking user.

10. **Classify Findings by Type**
    - **Blocking:** Specification gaps, missing AC clarity, undefined technical patterns (must fix before proceeding)
    - **High-severity:** Implementation ambiguities, incomplete error handling, vague metrics (should fix before implementation)
    - **Medium-severity:** Minor gaps, testing details, documentation improvements (nice to have but not blocking)
    - **Critical architectural issues:** Only escalate if reviewer flagged as "requires design rethink"
    <!-- INJECT: phase-3-5-step-1 -->

11. **Increment Iteration Counter**
    - Iteration 1 → 2 → 3 (max)
    - Track in `Session-Type: loop` ledger entry
    - Handoff payload includes: prior iteration count, findings summary, rework scope
    <!-- INJECT: phase-3-5-step-2 -->

12. **Determine Next Action**
    - **If iteration < 3:** Re-delegate to **Docs Curator** with structured rework scope:
      - Copy blocking + high-severity findings from prior review
      - Provide specific AC/section names to clarify
      - Request: "Address findings (blocking + high-severity) and resubmit for review"
      - Loop back to reviewer (Phase 3, step 7) with updated docs
    - **If iteration = 3 and still failing:** Escalate to **Design Planning Architect**
      - Signal: "Docs curator unable to resolve after 3 iterations; design clarity issue suspected"
      - Architect validates or clarifies design before next curator pass
    - **If iteration > 3:** Mark as BLOCKED; escalate to product/leadership for decision
    <!-- INJECT: phase-3-5-step-3 -->

### Phase 4: Finalization

13. **Approval & Completion** (after Phase 3.5 loop exits with PASS)
    - Reviewer approves final docs
    - Docs Curator sets Status: `Planned`
    - Update Last Update: current date
    - Record final iteration count in completion notes
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
Each reviewer runs Phase 3 checklist (steps 8-9) on their domain.
```

---

## When to Use This Workflow

✅ **Use direct-curator workflow when:**

- AC is clear and testable (no open ambiguities)
- Architecture is documented in `docs/architecture.md`
- No major unknowns or design conflicts
- Team has consensus on approach
- You are confident >80% (review gate catches remaining 20%)

❌ **Use design-gate workflow when:**

- AC is ambiguous or incomplete
- Architecture decisions are unclear
- Design conflicts exist
- Major unknowns in scope or approach
- Team needs alignment before docs

---

## Quality Gates Explained

This workflow relies on the **scope-dependent review gate** (Phase 3) as its primary quality safeguard:

- **No design gating upfront** → Direct docs production is faster
- **Scope-aware review downstream** → Routes to domain experts (Backend Auditor for backend stories, Security Auditor for security AC, etc.)
- **Escalation paths** → If reviewer finds conflicts outside their scope, escalate appropriately
- **Result:** Faster iteration for confident contexts; expert review on high-risk domains

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
