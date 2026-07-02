---
description: "Use when adding new logic, writing tests, or completing a story. Covers minimum testing requirements for new code: what must be tested and at what level. Prevents untested code from shipping."
applyTo: "apps/frontend/src/**/*.ts,apps/frontend/src/**/*.tsx,apps/backend/src/**/*.ts"
---

# Testing Requirements

## Minimum Coverage for New Code

Every new function, hook, reducer, or component must ship with tests:

| Code Type              | Required Tests                             | Example File               |
| ---------------------- | ------------------------------------------ | -------------------------- |
| Pure functions / utils | 1 unit test per exported function          | `pinyinUtils.test.ts`      |
| Hooks                  | 1 test per hook (happy path + 1 edge case) | `useReview.test.ts`        |
| Reducers / stores      | 1 test per action type                     | `quizSessionStore.test.ts` |
| Components             | 1 RTL test (render + user interaction)     | `ReviewCard.test.tsx`      |
| API services           | 1 integration test per endpoint            | `quizService.test.ts`      |
| Backend services       | 1 test per public method                   | `ReviewService.test.js`    |

## ❌ Never Ship Untested

- ❌ No "will add tests later" — write them with the code
- ❌ No skipping tests because "it works in dev" or "it's simple"
- ❌ No skipping tests for "just a quick fix"

## ✅ DO — Test alongside code

```typescript
// utils/pinyinUtils.ts
export function extractToneNumber(pinyin: string): number { ... }

// utils/__tests__/pinyinUtils.test.ts — created IN THE SAME PR
import { extractToneNumber } from '../pinyinUtils';

describe('extractToneNumber', () => {
  it('extracts tone from pinyin with tone mark', () => {
    expect(extractToneNumber('mā')).toBe(1);
  });

  it('handles neutral tone', () => {
    expect(extractToneNumber('ma')).toBe(0);
  });
});
```

## Run Tests Before Commit

```bash
npm test                    # full suite
npm test -- --run src/features/myfeature/  # or targeted
```

## Reasoning

Tests are not optional — they catch regressions, document expected behavior, and enable confident refactoring. The "story is complete" definition includes passing tests.
