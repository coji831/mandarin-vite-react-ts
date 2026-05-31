---
name: testing-workflow
description: Frontend and backend testing strategy with Vitest and RTL
status: inferred
source: "docs/guides/testing-guide.md, docs/guides/workflow.md"
confidence: high
type: testing
---

# Testing Workflow

<scan_confidence>high</scan_confidence>

## Frontend Testing (Vitest + React Testing Library)

### Steps

1. **Reducer Tests (Unit)**
   - Test each action type in isolation
   - Pattern: Given state + action → assert new state
   - File location: `__tests__/{reducer}.test.ts`
   - Coverage: all action cases, immutability validation
   <!-- INJECT: step-1-fe -->

2. **Hook Tests (Unit + Memoization)**
   - Test selector memoization (only recompute when dependencies change)
   - Test action creator stability (maintain reference equality)
   - Verify hooks return stable references
   <!-- INJECT: step-2-fe -->

3. **Component Tests (RTL)**
   - Mock state management hooks
   - Provide mock state via `ProgressStateContext.Provider`
   - Provide mock dispatch via `ProgressDispatchContext.Provider`
   - Test component behavior with different state values
   - Use role/text queries instead of brittle selectors
   <!-- INJECT: step-3-fe -->

4. **Integration Tests**
   - Test full data flow: user action → dispatch → reducer → state update → component re-render
   - Verify localStorage persistence
   <!-- INJECT: step-4-fe -->

5. **Run Tests**
   - All tests: `npm test`
   - Specific file: `npm test -- src/features/<feature>/`
   - Watch mode: `npm run test:watch --workspace=@mandarin/frontend`
   - Coverage: `npm run test:coverage --workspace=@mandarin/frontend`
   <!-- INJECT: step-5-fe -->

## Backend Testing (Vitest)

### Steps

1. **Controller Tests**
   - Mock Service layer (not Repository)
   - Test HTTP status codes, cookie management, request/response mapping
   - Verify response structure matches ApiResponse<T>
   <!-- INJECT: step-1-be -->

2. **Service Tests**
   - Mock Repository layer and external Infrastructure clients (Gemini, GCS)
   - Test business logic, validation, orchestration
   - Verify error handling and graceful degradation
   <!-- INJECT: step-2-be -->

3. **Repository Tests**
   - Use testcontainers for isolated database testing
   - Test CRUD operations, query filtering, transaction behavior
   - Verify Prisma model mapping
   <!-- INJECT: step-3-be -->

4. **Infrastructure Tests**
   - Test external API integrations (Google TTS, Gemini, GCS)
   - Mock network calls with `vi.fn()`
   - Test error handling and retry logic
   - Verify authentication flows
   <!-- INJECT: step-4-be -->

5. **Run Tests**
   - All tests: `npm test --workspace=@mandarin/backend`
   - Specific file: `npm test -- tests/integration/database.test.js`
   - Watch mode: `npm run test:watch --workspace=@mandarin/backend`
   - Coverage: `npm run test:coverage --workspace=@mandarin/backend`
   - Database tests only: `npm run test:db`
   <!-- INJECT: step-5-be -->

## Pre-Commit Testing Checklist

<!-- INJECT: step-6 -->

- [ ] All tests pass: `npm test`
- [ ] No type errors: `tsc --noEmit`
- [ ] No lint errors: `npm run lint`
- [ ] Coverage minimum met (if configured)
- [ ] Edge cases covered (at least one per AC)
- [ ] Mocks verify correct integration points

<!-- INJECT: append-steps -->

---

## Related Documentation

- [Testing Guide](../../docs/guides/testing-guide.md)
- [Quiz State Management Guide](../../docs/guides/quiz-state-management-guide.md)
