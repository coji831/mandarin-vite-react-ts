# Business Requirements Large Epic Template

# Epic [NUMBER]: [Epic Title]

## Epic Summary

**Goal:** [One-sentence goal statement]

**Key Points:**

- [Point 1 - most critical insight]
- [Point 2 - second most important point]
- [Point 3 - third most important point]
- [Point 4 - fourth most important point]
- [Point 5 - fifth most important point]

**Status:** [Planned/In Progress/Completed]

**Last Update:** [Date]

## Background

[Provide context about the problem being solved. Explain why this epic is important from a business perspective and what user needs it addresses.]

## User Stories

This epic consists of the following user stories:

1. #[ISSUE-NUMBER] / [**Story Title**](./story-[EPIC-NUM]-[STORY-NUM]-[SHORT-TITLE].md)

   - As a [user role], I want to [action/feature], so that [benefit/value].

2. #[ISSUE-NUMBER] / [**Story Title**](./story-[EPIC-NUM]-[STORY-NUM]-[SHORT-TITLE].md)

   - As a [user role], I want to [action/feature], so that [benefit/value].

3. #[ISSUE-NUMBER] / [**Story Title**](./story-[EPIC-NUM]-[STORY-NUM]-[SHORT-TITLE].md)

   - As a [user role], I want to [action/feature], so that [benefit/value].

<!-- Add more stories as needed -->

## Story Breakdown Logic

This epic is divided into stories based on the following approach:

- Stories [X.1-X.Y] focus on [first logical grouping] ([status])
- Stories [X.Y-X.Z] focus on [second logical grouping] ([status])

[Explain the rationale for how stories are divided and how they build upon each other.]

## Acceptance Criteria

Write Acceptance Criteria as a Markdown task-list (checkboxes). Each checklist item should be short, actionable, and testable. The number of items is not fixed — add as many checklist lines as you need for the epic.

Example (minimal):

- [ ] <short, testable acceptance criterion and how to verify it>
- [ ] <short, testable acceptance criterion and how to verify it>

Guidance:

- The checklist may contain 1..N items — there is no fixed limit.
- Map each checklist item to at least one story or test case. Keep items concise (one line) and include a clear verifier (what to check and how).
- When preparing a PR for this epic, update the checklist status in the PR description to reflect completed items and reference story/issue numbers where applicable.

## Architecture Decisions

[Record key architecture decisions for this epic. For each decision include the chosen approach, rationale, alternatives considered, and implications (tradeoffs). Use concrete examples where helpful, otherwise keep placeholders.]

- Decision: <DECISION_NAME> (choice)

  - Rationale: <WHY_THIS_CHOICE>
  - Alternatives considered: <ALTERNATIVE_1>, <ALTERNATIVE_2>
  - Implications: <TRADEOFFS>

- Decision: <ANOTHER_DECISION> (choice)
  - Rationale: <WHY_THIS_CHOICE>

## Implementation Plan

Provide a short, numbered list of implementation step titles for this epic. The number of steps may vary (1..N). Replace the placeholders below with the actual step titles for your work.

1. Step 1
2. Step 2
3. Step 3
   ...n. Step n

Keep titles concise; add detailed implementation notes, verification steps, and issue references in the PR or story that implements each step.

## Risks & mitigations

[List key risks, assign a severity (High/Medium/Low), and provide explicit mitigations and rollback steps. Keep entries short and actionable. Use placeholders where projects differ.]

- Risk: <RISK_SUMMARY> — Severity: <High/Medium/Low>

  - Mitigation: <CONCRETE_STEPS>
  - Rollback: <RESTORE_INSTRUCTIONS>

- Risk: <ANOTHER_RISK> — Severity: <High/Medium/Low>
  - Mitigation: <CONCRETE_STEPS>
  - Rollback: <RESTORE_INSTRUCTIONS>

## Implementation notes

[Add coding or operational notes relevant to implementers. Include links to project guides and any conventions or operational patterns to follow. Use placeholders where specific values are required.]

- Conventions: follow `docs/guides/code-conventions.md` and `docs/guides/solid-principles.md`
- Operational notes: <ANY_RUNTIME_NOTES_OR_FEATURE_FLAGS>
- Links: reference implementation templates at `docs/templates/implementation-large-epic-template.md`
