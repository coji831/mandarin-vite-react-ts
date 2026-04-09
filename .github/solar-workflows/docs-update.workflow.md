---
name: docs-update
description: Documentation update workflow for syncing BR/implementation docs after code changes, architecture updates, or tech stack changes
status: proposed
source: "user-requested"
confidence: high
type: documentation-workflow
---

# Documentation Update Workflow — Sync BR & Implementation Docs

<scan_confidence>high</scan_confidence>

## Overview

When code implementation is complete, architecture changes, or tech stack shifts (e.g., JavaScript + domain classes vs TypeScript), existing story BR and implementation docs must be synchronized. This workflow identifies affected docs, routes updates to appropriate curators/architects, reviews changes, and ensures cross-doc alignment.

## Steps

### Phase 1: Change Trigger & Scope Identification

**Agent: Governor (you or automated detector)**

1. **Identify Trigger Type**
   - [ ] **Code implementation complete:** Story implementation finished; docs need Status update + decisions recorded
   - [ ] **Tech stack change:** Language, framework, or architecture pattern changed (e.g., TypeScript → JavaScript + domain classes)
   - [ ] **Architecture decision change:** Core design pattern updated (e.g., new caching strategy, new validation approach)
   - [ ] **Acceptance criteria update:** AC clarified or refined post-implementation
   - [ ] **Cross-doc dependency:** Other BR/impl docs reference this one; cascading updates needed
   <!-- INJECT: phase-1-step-1 -->

2. **Collect Affected Documents**
   - List all story BR files that need updating
   - List all story implementation files that need updating
   - Flag any epic-level docs (README.md) affected
   - Identify architecture/guide docs that may need alignment (docs/architecture.md, docs/guides/code-conventions.md, etc.)
   <!-- INJECT: phase-1-step-2 -->

3. **Determine Update Scope**
   - [ ] **Limited scope:** Status updates, dates, PR reference (no content changes)
   - [ ] **Moderate scope:** Add Technical Challenges section, update implementation details, clarify decisions
   - [ ] **Large scope:** Major content rewrites, AC clarification, architecture pattern changes
   - Route to appropriate subagent based on scope (see Phase 1.5)
   <!-- INJECT: phase-1-step-3 -->

### Phase 1.5: Design Verification Gate

**Agent: Design Planning Architect**

4. **Assess Update Context Sufficiency**
   - [ ] PR/commit references provided (if code implementation complete)
   - [ ] Technical decisions documented (what changed, why, trade-offs)
   - [ ] AC status clear (which items complete, which deferred, why)
   - [ ] Architecture-level context available (domain classes, patterns, validation approach if tech stack changed)
   - Confidence threshold: >80% (minor ambiguities OK; major gaps → halt and request clarification)
   <!-- INJECT: phase-1-5-step-1 -->

5. **Verify Document Format & Template Compliance**
   - [ ] Current BR doc follows exact template from `docs/templates/story-business-requirements-template.md`
   - [ ] Current implementation doc follows exact template from `docs/templates/story-implementation-template.md`
   - [ ] No custom sections added or required sections missing
   - [ ] Headings match template exactly (case-sensitive)
   - Flag any template violations that Curator must preserve or flag
   <!-- INJECT: phase-1-5-step-2 -->

6. **Provide Update Guidance & Context Package**
   - Produce structured handoff payload:
     - `updateType`: "code_implementation" | "tech_stack_change" | "architecture_change" | "ac_clarification"
     - `affectedSections`: List of BR/impl doc sections that need updates
     - `templateReminders`: Specific sections Curator must preserve exactly (no content changes)
     - `contextSummary`: Key decisions, challenges, tech stack details
     - `exampleContent`: Example text for Technical Challenges section (if creating new)
     - `crossLinkMap`: Which docs link to this one; require validation after update
   - If context insufficient: STOP and return list of required inputs before Curator proceeds
   <!-- INJECT: phase-1-5-step-3 -->

7. **Gate Decision**
   - [ ] **APPROVE (Proceed to Phase 2):** Context sufficient, format valid, guidance provided
   - [ ] **HOLD & REQUEST INFO:** Missing critical context; define specific inputs needed
   - [ ] **ESCALATE (to user):** Major ambiguities; requires human decision before proceeding
   <!-- INJECT: phase-1-5-step-4 -->

### Phase 2: Docs Curator — BR & Implementation Update

### Phase 2: Docs Curator — BR & Implementation Update

**Agent: Docs Curator** (receives handoff payload from Phase 1.5)

8. **Update Story BR Documents**
   - [ ] Update `Status:` field (e.g., "Planned" → "In Progress" → "Completed")
   - [ ] Update `Last Update:` date to current date
   - [ ] Check all AC boxes if implementation complete
   - [ ] Add `Implementation Status` section: PR link, commit hash, merge date (if applicable)
   - [ ] Add `Technical Challenges & Solutions` subsection if non-trivial issues encountered
   - [ ] Verify all Related Issues links are still valid
   - [ ] Preserve template structure; do not add/remove sections
   <!-- INJECT: phase-2-step-1 -->

9. **Update Story Implementation Documents**
   - [ ] Update `Status:` field (e.g., "Planned" → "In Progress" → "Completed")
   - [ ] Update `Last Update:` date to current date
   - [ ] Record key implementation decisions (not in original plan but discovered during coding)
   - [ ] Update `Technical Scope` section if new files created or removed
   - [ ] Add concrete code examples if architecture pattern changed (e.g., domain class usage, validation guards)
   - [ ] Update test counts and coverage summary in completion notes
   - [ ] Add `Technical Challenges & Solutions` section with:
     - Challenge title
     - Problem description
     - Root cause analysis
     - Solution implemented (with code examples)
     - Lesson learned
   - [ ] Preserve template structure; do not add/remove sections
   - [ ] Link to PR and key commits
   <!-- INJECT: phase-2-step-2 -->

10. **Cross-Link Updated Documents**

- [ ] Verify Epic BR ↔ Story BR links still bidirectional
- [ ] Verify Story BR ↔ Story Implementation links still bidirectional
- [ ] Update Related Issues/Tasks sections with any new dependencies
- [ ] Verify no broken links (especially to code files, commit hashes, PR URLs)
<!-- INJECT: phase-2-step-3 -->

11. **Sync High-Level Architecture Docs (if scope large)**

- [ ] Update `docs/architecture.md` if core patterns changed
- [ ] Update relevant guide docs (e.g., `docs/guides/code-conventions.md` if new pattern emerged)
- [ ] Add cross-links from high-level docs to story implementation doc for context
- [ ] Do NOT reference specific story/epic numbers in high-level docs; use descriptive feature names
<!-- INJECT: phase-2-step-4 -->

### Phase 3: Scope-Dependent Review Routing

**Agent: Governor + Auditors**

12. **Identify Doc Update Scope**

- Scan all updated BR and implementation docs
- Classify by domain: architecture, backend, frontend, security, performance
- Determine if changes require domain expert review (auditor)
<!-- INJECT: phase-3-step-1 -->

13. **Route to Review Agent (if scope warrants review)**

    **Only review if:**

- [ ] Status changed to "Completed"
- [ ] New technical decisions added to implementation doc
- [ ] Technical Challenges & Solutions section describes non-trivial discoveries
- [ ] Architecture-level changes documented

**If architecture-primary:**

- Delegate to **Design Planning Architect**
- Verify architectural decisions align with system design
- Validate domain class patterns / validation guards documented clearly

**If backend-heavy:**

- Delegate to **Backend Review Auditor**
- Verify implementation details (services, cache, validation) accurately reflect code
- Ensure technical challenges are realistic and solutions sound

**If frontend-heavy:**

- Delegate to **Frontend Review Auditor**
- Verify component/state patterns documented match implementation
- Ensure performance targets and test requirements documented

**If security-related:**

- Delegate to **Security Auditor**
- Verify validation/error handling decisions documented
- Ensure security trade-offs explained in challenges section

**Note:** Multiple auditors may review in sequence for complex updates

   <!-- INJECT: phase-3-step-2 -->

14. **Review Checklist (All Agents)**
    - [ ] Template compliance: all required sections present, no rearrangements
    - [ ] Status and dates consistent across BR and implementation docs
    - [ ] AC boxes correctly checked (or documented reason if incomplete)
    - [ ] Technical Challenges & Solutions section (if applicable) is clear and actionable
    - [ ] Cross-links valid and bidirectional
    - [ ] No broken references to code, commits, or PRs
    - [ ] Architecture/tech stack changes accurately reflected
    - [ ] All decisions justified (trade-offs, alternatives explained)
    <!-- INJECT: phase-3-step-3 -->

15. **Review Decision Outcomes + Auto-Loop Trigger**
    - **If all checks pass:** Sign off → proceed to finalization (Phase 4)
    - **If failures found:** **AUTOMATICALLY invoke `/ralph-loop` for Phase 3.5** (same as creation workflow)
      - System detects review status ≠ PASS
      - Captures findings (blocking + high-severity) to handoff payload
      - Switches `Session-Type: loop` in ledger
      - Invokes recursive-remediation agent to delegate Docs Curator fix + re-review cycle
      <!-- INJECT: phase-3-step-4 -->

### Phase 3.5: Bounded Revision Loop

When review produces findings, automatically loop Docs Curator to fix.

16. **Classify Findings by Type**
    - **Blocking:** Inaccurate technical claims, contradictions with code, missing critical decisions
    - **High-severity:** Incomplete challenges section, vague decisions, missing code examples
    - **Medium-severity:** Minor clarifications, link fixes, formatting
    <!-- INJECT: phase-3-5-step-1 -->

17. **Increment Iteration Counter**
    - Iteration 1 → 2 → 3 (max)
    - Track in ledger
    - Handoff payload includes: prior findings, rework scope
    <!-- INJECT: phase-3-5-step-2 -->

18. **Determine Next Action**
    - **If iteration < 3:** Re-delegate to **Docs Curator** with findings
      - Copy blocking + high-severity items
      - Request: "Revise docs to address findings and resubmit for review"
      - Loop back to reviewer (Phase 3, step 13)
    - **If iteration = 3 and still failing:** Escalate to **Design Planning Architect**
      - Signal: "Docs unclear; design needs clarification before final approval"
    - **If iteration > 3:** Mark as BLOCKED
    <!-- INJECT: phase-3-5-step-3 -->

### Phase 4: Finalization

**Agent: Governor + Docs Curator**

19. **Final Approval & Completion**
    - [ ] All reviewers have signed off (or deemed review unnecessary)
    - [ ] All AC checked or documented exception
    - [ ] Status fields updated consistently (Completed, In Progress, etc.)
    - [ ] Last Update dates synchronized
    - [ ] All cross-links verified
    - [ ] Technical Challenges & Solutions documented (if applicable)
    <!-- INJECT: phase-4-step-1 -->

20. **Knowledge Base Extraction (if applicable)**
    - [ ] Review Technical Challenges & Solutions for reusable patterns
    - [ ] If challenge took >3 hours to resolve, extract to `docs/knowledge-base/`
    - [ ] If new coding pattern discovered, update `docs/guides/code-conventions.md`
    - [ ] Add cross-links from story implementation doc to KB articles
    <!-- INJECT: phase-4-step-2 -->

21. **Commit & Merge**
    - [ ] Stage all updated BR + implementation doc files
    - [ ] Commit message: `docs(story-X-Y): update status and technical decisions after implementation`
    - [ ] Include PR link in commit if applicable
    - [ ] Merge to main branch
    <!-- INJECT: phase-4-step-3 -->

---

## Agent Routing Summary

| Phase   | Step                         | Agent                                              | Decision Criteria                                                                       |
| ------- | ---------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 1       | Trigger & Scope              | Governor                                           | User initiates or automated detector triggers                                           |
| **1.5** | **Design Verification Gate** | **Design Planning Architect**                      | **Verifies context sufficiency, format, template compliance; provides update guidance** |
| 2       | BR/Impl Update               | **Docs Curator**                                   | Executes content updates using handoff from Phase 1.5                                   |
| 3       | Review Routing               | Governor                                           | Scope-dependent classification                                                          |
| 3 / 3.5 | Review & Loop                | **Architecture/Backend/Frontend/Security Auditor** | Determined in Phase 3, step 13                                                          |
| 4       | Finalization                 | Governor + Docs Curator                            | After Phase 3.5 loop exits PASS                                                         |

---

## When to Use This Workflow

✅ **Use doc-update workflow when:**

- Story implementation is complete; docs need Status update
- Tech stack or architecture changed; docs need sync
- PR ready for review; implementation decisions need recording
- AC clarified post-implementation; docs need alignment
- Epic dependencies require cascading doc updates

❌ **Use doc-creation workflow instead when:**

- Creating new story docs for the first time
- No prior BR/implementation docs exist
- Starting from blank template (not modifying existing)

---

## Documentation Update Workflow — Visual Flow

```
User Request (Code done / Tech change / Architecture change)
    ↓
Phase 1: Scope Identification (Governor)
    ├─ Identify trigger type
    ├─ Collect affected docs
    └─ Determine update scope
    ↓
Phase 1.5: Design Verification Gate (Design Planning Architect) ⭐ NEW
    ├─ Assess context sufficiency (>80% confidence required)
    ├─ Verify template compliance (format check)
    ├─ Produce guidance package (context + examples + cross-links)
    └─ Gate decision:
        ├─ APPROVE → proceed to Phase 2
        ├─ HOLD → request missing context (return to user)
        └─ ESCALATE → human decision needed
    ↓
Phase 2: Docs Curator Update (Docs Curator)
    ├─ Update BR document (apply Phase 1.5 guidance)
    ├─ Update implementation document
    ├─ Cross-link documents
    └─ Sync architecture docs (if needed)
    ↓
Phase 3: Review Routing (Governor + Auditors)
    ├─ Scope classification
    ├─ Review gate (if status=Completed or major changes)
    └─ Findings detected?
        ├─ NO → proceed to Phase 4
        └─ YES → Phase 3.5 (loop)
    ↓
Phase 3.5: Bounded Revision Loop (Curator + Auditors)
    ├─ Iteration 1: Curator fixes → Auditor reviews
    ├─ Iteration 2: Curator fixes → Auditor reviews
    ├─ Iteration 3: Curator fixes → Auditor reviews
    └─ If still failing → escalate to Design Planning Architect
    ↓
Phase 4: Finalization (Governor + Curator)
    ├─ Final approval
    ├─ Knowledge base extraction (if Technical Challenges present)
    └─ Commit & merge
    ↓
Complete ✅
```

---

## Key Differences from Doc-Creation Workflow

| Aspect                | Doc-Creation                               | Doc-Update                                                          |
| --------------------- | ------------------------------------------ | ------------------------------------------------------------------- |
| **Trigger**           | Epic/story planning starting               | Code implementation completing                                      |
| **New Phase 1.5**     | (does not exist)                           | ⭐ Design Verification Gate (provided by Design Planning Architect) |
| **Template**          | Blank template filled in                   | Existing docs refined                                               |
| **Curator role**      | Create all sections                        | Update specific sections, preserve structure                        |
| **Design gate input** | None (direct to curator if confident)      | Full context package from Phase 1.5                                 |
| **Review path**       | Design review (if needed) → domain auditor | Domain auditor only (if scope warrants)                             |
| **Output**            | New 6+ story documents                     | Updated 2–4 existing documents                                      |
| **Auto-loop**         | Yes (same as update)                       | Yes (same as update)                                                |
| **KB extraction**     | Optional (new patterns only)               | Mandatory (technical challenges)                                    |

---

## Related Documentation

- [Docs Curator Agent](../../.github/AGENTS.md)
- [Doc-Creation Workflow](docs-creation-direct-curator.workflow.md)
- [Design Planning Architect Agent](../../.github/AGENTS.md)
- [Backend Review Auditor Agent](../../.github/AGENTS.md)
- [Frontend Review Auditor Agent](../../.github/AGENTS.md)
- [Security Auditor Agent](../../.github/AGENTS.md)
- [Business Requirements Template](../../docs/templates/story-business-requirements-template.md)
- [Implementation Template](../../docs/templates/story-implementation-template.md)
- [Knowledge Base Update Protocol](../../.github/copilot-instructions.md#-knowledge-base-update-protocol)
