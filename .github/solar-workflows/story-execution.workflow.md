---
name: story-execution
description: Story-level implementation workflow with review, test, and commit gates
status: inferred
source: ".github/copilot-instructions.md, docs/guides/workflow.md"
confidence: high
type: story-execution
---

# Story Execution Workflow

<scan_confidence>high</scan_confidence>

## Steps

1. **Review Requirements**
   - Open story BR file (`docs/business-requirements/epic-<num>-<slug>/story-<epic>.<story>-*.md`)
   - Open epic BR README
   - Open corresponding implementation docs
   - Confirm Acceptance Criteria (AC) clarity
   <!-- INJECT: step-1 -->

2. **Plan Changes**
   - Identify impacted feature folder(s) under `src/features/`
   - Check design doc (`src/features/<feature>/docs/design.md`)
   - Check `docs/architecture.md` for conflicts
   - Prepare file header summaries if adding public APIs
   <!-- INJECT: step-2 -->

3. **Implement Code**
   - Create/update components, hooks, reducers, types within feature folder
   - Maintain state rules (domain-prefixed action types, immutable updates, normalized collections)
   - Keep scope tightly bound to story AC
   <!-- INJECT: step-3 -->

4. **Tests (Create / Update)**
   - Add or adjust unit/component tests covering happy path + edge cases
   - Ensure new reducers/actions/selectors have isolated tests
   - Avoid brittle UI assertions (prefer role/text queries via RTL)
   <!-- INJECT: step-4 -->

5. **Run Locally (If Needed)**
   - Start app: `npm run dev`
   - Start local backend (if API integration touched): `npm run dev:backend`
   - Manual sanity check: exercise UI path for story
   <!-- INJECT: step-5 -->

6. **Update Documentation**
   - Story BR: mark progressed AC
   - Story implementation doc: record decisions, data shape changes, performance notes
   - Add "Technical Challenges & Solutions" section if >1h debugging or architectural decisions
   - Epic docs: only update if cross-cutting decisions changed
   - Update Last Update date fields
   <!-- INJECT: step-6 -->

7. **Pre-Commit Gate**
   - Run tests: `npm test` → must pass
   - Type check: `tsc --noEmit` → ensure clean
   - Lint: ESLint → ensure clean
   - Verify Quality Gates & Cross-Doc Alignment checklists
   <!-- INJECT: step-7 -->

8. **Commit (When Allowed)**
   - Use Conventional Commit format: `<type>(story-<epic>-<story>): <summary>`
   - Include scope referencing story (e.g., `feat(story-11-2): add progress sync reducer`)
   - Ensure BR + implementation doc updates are in same commit for traceability
   <!-- INJECT: step-8 -->

<!-- INJECT: append-steps -->

---

## Related Documentation

- [Workflow Checklist](../../docs/guides/workflow.md)
- [Code Conventions](../../docs/guides/code-conventions.md)
- [Git Convention](../../docs/guides/git-convention.md)
