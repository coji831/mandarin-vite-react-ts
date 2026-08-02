# Template For Story Implementation

**Last Updated:** June 2, 2026

# Implementation [EPIC_NUMBER]-[STORY_NUMBER]: [Story_Title]

> **BR Reference:** `docs/business-requirements/epic-<num>-<slug>/story-<epic>-<story>-<short>.md`
> **Last Updated:** <date>
> **Status:** <Planned / In Progress / Completed>

## Technical Scope

<Specific technical components, files, and functionality implemented. Include a short paragraph describing the scope, then a bulleted "Files:" list mapping each touched file to its role.>

**Files:**

- `path/to/file.ts` — <role or "update: what changed">
- `path/to/file.tsx` — **NEW**: <role>
- `path/to/file.test.ts` — **NEW**: <unit tests>

## Implementation Details

```typescript
// Example code pattern
function implementedPattern() {
  // Key implementation details
  // Show actual code patterns used
}
```

<Include relevant code snippets, algorithms, data structures, and design patterns. Use sub-headers (###) for each distinct implementation area.>

## Architecture Integration

<How this implementation connects with the broader system architecture — which modules/features it touches, which prior stories it depends on, and any data flow.>

```
[This Feature] → integrates with → [Other System Components]
            ↓ uses
[Shared Services/Utilities]
```

## Technical Challenges & Solutions

<Specific technical challenges encountered and how they were addressed. **REQUIRED when non-trivial — debugging >1h, schema issues, architectural decisions. If none, write 'None of note' (one line).**>

```
Problem: <Technical issue encountered>
Solution: <Implementation approach with code example>
```

### Doc Truth-Check

- [ ] Endpoints match `ROUTE_PATTERNS` in `packages/shared-constants/src/index.js` (path + verb copied verbatim)
- [ ] Feature/module/component names verified against `apps/backend/src/modules/` and `apps/frontend/src/features/`
- [ ] Data source (static JSON vs Postgres/API) matches the backing service/repository code
- [ ] All relative markdown links resolve
- [ ] Last Updated / Last Update date is current (same commit as the edit)

> **Note:** PR / Merge Date / Key Commit stay literal `TBD` until commit, filled same-commit; never merge with TBD.

## Testing Implementation

<Specific testing approaches, edge cases handled, and verification methods used. Unit/component tests, Storybook stories, and any manual verification gates.>
