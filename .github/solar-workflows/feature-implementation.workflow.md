---
name: feature-implementation
description: Frontend feature folder structure and implementation patterns
status: inferred
source: "apps/frontend/README.md, .github/copilot-instructions.md"
confidence: high
type: implementation
---

# Feature Implementation Workflow

<scan_confidence>high</scan_confidence>

## Frontend Feature Structure

### Steps

1. **Create Feature Folder**
   - Location: `src/features/<feature>/`
   - Structure:
     ```
     src/features/<feature>/
       ├── components/
       ├── hooks/
       ├── reducers/
       ├── types/
       ├── docs/
       │   └── design.md
       ├── __tests__/
       ├── index.ts
       └── routes.tsx
     ```
     <!-- INJECT: step-1 -->

2. **Define Types**
   - Location: `types/`
   - Use `type` instead of `interface` for definitions
   - Export types from `index.ts` for public API
   - Always use explicit type annotations
   <!-- INJECT: step-2 -->

3. **Create Reducer**
   - File: `reducers/<domain>Reducer.ts`
   - Action type format: `<DOMAIN>_<ACTION>` (SCREAMING_SNAKE_CASE)
   - Action creator in `hooks/useActions.ts`
   - Selector in `hooks/useState.ts`
   - All updates immutable (use spreads)
   <!-- INJECT: step-3 -->

4. **Create Components**
   - Use functional components with hooks
   - Prefer named function declarations
   - Keep props types explicit
   - Export from feature `index.ts`
   - Use feature design doc for reference
   <!-- INJECT: step-4 -->

5. **Create Hooks**
   - Action hooks: `const { doSomething } = useMyActions()`
   - State selectors: `const value = useMyState(s => s.slice?.value ?? fallback)`
   - Custom hooks for reusable logic
   - Test memoization and reference stability
   <!-- INJECT: step-5 -->

6. **Create Context Provider**
   - Provider component wraps page or app section
   - Add reducer to provider
   - Export contexts and provider from `index.ts`
   - Document context structure in design doc
   <!-- INJECT: step-6 -->

7. **Add Routing**
   - Create `routes.tsx` with feature routes
   - Use route constants from `src/constants/paths.ts`
   - Lazy-load route components if needed
   - Update main router to include feature routes
   <!-- INJECT: step-7 -->

8. **Write Tests**
   - Reducer tests: `__tests__/{reducer}.test.ts`
   - Hook tests: `__tests__/{hook}.test.ts`
   - Component tests: `__tests__/{component}.test.tsx`
   - Coverage: happy path + 1+ edge case per AC
   <!-- INJECT: step-8 -->

9. **Add Design Documentation**
   - File: `docs/design.md`
   - Include:
     - Feature purpose and scope
     - Architecture decisions and rationale
     - State shape and flow diagram
     - API contracts and data transformations
     - Performance considerations
     - Known limitations and future improvements
     <!-- INJECT: step-9 -->

## State Management Checklist

<!-- INJECT: step-10 -->

- [ ] Define reducer in `reducers/`
- [ ] Export actions from `hooks/useActions.ts`
- [ ] Export selectors from `hooks/useState.ts`
- [ ] Add reducer to context provider
- [ ] Write reducer tests
- [ ] Write hook tests (memoization)
- [ ] Update feature design doc

<!-- INJECT: append-steps -->

---

## Related Documentation

- [Code Conventions](../../docs/guides/code-conventions.md)
- [Frontend README](../../apps/frontend/README.md)
