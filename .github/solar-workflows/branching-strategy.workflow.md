---
name: branching-strategy
description: Epic-based branching and git workflow with conventional commits
status: inferred
source: "docs/guides/git-convention.md, .github/copilot-instructions.md"
confidence: high
type: branching-strategy
---

# Epic-Based Branching Strategy

<scan_confidence>high</scan_confidence>

## Overview

This repository uses a **single-branch-per-epic** approach. All stories within an epic are developed on the same branch, implemented sequentially, and merged as one unit.

## Steps

1. **Create Epic Branch**
   - Branch from `main`: `git checkout -b epic-X-<slug>`
   - Name format: lowercase, hyphens between words
   - Example: `epic-11-service-layer-overhaul`
   <!-- INJECT: step-1 -->

2. **Implement Stories Sequentially**
   - Develop Story X.1, commit with message: `feat(story-X-1): description`
   - Develop Story X.2, commit with message: `feat(story-X-2): description`
   - Continue for all stories in epic
   - Each story is independently reviewable via commit history
   <!-- INJECT: step-2 -->

3. **Use Conventional Commit Format**
   - Format: `<type>(<scope>): <description>`
   - Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
   - Scopes: `epic-X`, `story-X-Y`, `component`, `hook`, `api`, `docs`, `test`
   - Example: `feat(story-14-2): add typed axios client with interceptor`
   <!-- INJECT: step-3 -->

4. **Feature Flags (For Early Merging)**
   - For incomplete epics requiring early merge, use feature flags
   - Pattern: `process.env.FEATURE_<NAME> && <Component />`
   - Document flag names & purpose in epic BR and implementation README
   <!-- INJECT: step-4 -->

5. **Create Pull Request**
   - PR title: `[EPIC-X] Story X.Y: Brief description`
   - Example: `[EPIC-14] Story 14.2: Add Typed Axios Client`
   - Include summary of all stories in description
   - Reference related issues and dependent stories
   <!-- INJECT: step-5 -->

6. **Code Review & Merge**
   - Review entire epic as one unit
   - All tests must pass: `npm test`
   - Type check must pass: `tsc --noEmit`
   - Lint must pass: `npm run lint`
   - Merge with squash or commit history (team preference)
   <!-- INJECT: step-6 -->

7. **Verify BD + Implementation Docs Updated**
   - Story BR: all AC marked complete
   - Implementation docs: Status set to "Completed"
   - Last Update dates synchronized
   - All cross-links verified
   <!-- INJECT: step-7 -->

<!-- INJECT: append-steps -->

---

## Commit Message Examples

```
feat(story-13-5): add Redis caching layer with fail-open behavior
fix(story-14-3): correct Axios error interceptor normalization
docs(epic-11): update architecture for new service layer
refactor(story-9-3): split contexts for performance optimization
test(story-15-2): add integration tests for spaced repetition algorithm
```

---

## Related Documentation

- [Git Convention Guide](../../docs/guides/git-convention.md)
- [Commit Message Template](../../docs/templates/commit-message-template.md)
