# Epic 19: State Management Refactor (Deferred)

## Epic Summary

**Goal:** **[CONDITIONAL - ONLY IF PAIN POINTS EMERGE]** Migrate frontend state management from Context + Reducers to Zustand for simpler API, better DevTools support, and reduced boilerplate.

**Key Points:**

- Current Context + Reducer pattern working well with clean architecture and normalized state
- Migration only justified if: performance issues (>100ms state updates), team requests DevTools, or cross-slice dependencies unmanageable
- Zustand chosen over Redux Toolkit (simpler API, less boilerplate, similar DX to Context)
- Incremental migration one slice at a time (`ui` → `user` → `lists`) minimizes risk
- Reducer logic (pure functions) portable to Zustand stores with minimal changes

**Status:** **Deferred** (No current pain points)

**Last Update:** February 2, 2026

## Background

The current frontend state management uses Context API + Reducers with three slices: `lists`, `user`, `ui`. This architecture follows best practices documented in `docs/guides/code-conventions.md`:

**Current Strengths:**

- ✅ Clean separation of concerns (domain-prefixed action types)
- ✅ Normalized state (`itemsById` + `itemIds` pairs)
- ✅ Immutable updates via spread operators
- ✅ Selectors with fallbacks prevent undefined errors
- ✅ Reducer tests isolated and maintainable

**Why This Epic is DEFERRED:**

The current system has **no significant pain points**. Before investing 20-30 hours in migration:

1. **Performance is acceptable**: No state updates exceed 16ms (60fps threshold)
2. **Team familiar with pattern**: No learning curve for new contributors
3. **No DevTools needed yet**: App complexity doesn't warrant time-travel debugging
4. **No cross-slice issues**: Slices remain independent (no action interdependencies)

**Triggers to Revisit This Epic:**

- [ ] Performance profiling shows state updates >100ms (blocking UI interactions)
- [ ] 3+ developers request Redux DevTools for debugging complex state flows
- [ ] Cross-slice dependencies emerge (actions in one slice need data from another)
- [ ] Team consensus: Current pattern too verbose for adding new state features
- [ ] Epic 15-17 features introduce state complexity exceeding Context API capabilities

**If Migration Needed:**

Choose **Zustand** over Redux Toolkit:

- Simpler API (less boilerplate than Redux)
- Better TypeScript inference
- Similar DX to Context (easy transition)
- Built-in DevTools support
- Smaller bundle size (~1KB vs. Redux ~15KB)

## User Stories

**[CONDITIONAL - Only create if migration triggered]**

This epic consists of the following user stories:

1. [**Story 19.1: Zustand Migration Assessment**](./story-19-1-zustand-assessment.md)
   - As a **frontend developer**, I want to **evaluate Zustand vs. current Context pattern with concrete metrics**, so that **migration decision is data-driven**.

2. [**Story 19.2: Migrate `ui` Slice to Zustand**](./story-19-2-migrate-ui-slice.md)
   - As a **frontend developer**, I want to **migrate the simplest slice (`ui`) to Zustand first**, so that **team learns pattern with minimal risk**.

3. [**Story 19.3: Migrate `user` Slice to Zustand**](./story-19-3-migrate-user-slice.md)
   - As a **frontend developer**, I want to **migrate `user` slice to Zustand**, so that **authentication state benefits from DevTools debugging**.

4. [**Story 19.4: Migrate `lists` Slice to Zustand**](./story-19-4-migrate-lists-slice.md)
   - As a **frontend developer**, I want to **migrate the largest slice (`lists`) to Zustand**, so that **vocabulary state benefits from performance optimizations**.

## Story Breakdown Logic

**[ONLY IF TRIGGERED]** Migration follows incremental approach:

- **Story 19.1** assesses whether migration justified (may result in "keep Context" decision)
- **Story 19.2** migrates smallest slice (`ui` - ~50 lines) to validate approach
- **Story 19.3** migrates medium slice (`user` - ~150 lines) to build confidence
- **Story 19.4** migrates largest slice (`lists` - ~300 lines) to complete migration

Each story maintains existing API surface (components don't change), allowing rollback per slice.

## Acceptance Criteria

**[ONLY IF EPIC TRIGGERED - Otherwise N/A]**

- [ ] All Context providers removed (`ListsProvider`, `UserProvider`, `UIProvider`)
- [ ] Zustand stores created for each slice with identical state shape
- [ ] All components updated to use Zustand hooks (`useListsStore`, `useUserStore`, `useUIStore`)
- [ ] Redux DevTools extension connected and functional
- [ ] Performance benchmarks show no regression (state updates <100ms)
- [ ] All existing tests updated and passing
- [ ] `docs/guides/code-conventions.md` updated with Zustand patterns
- [ ] Team trained on Zustand usage (pair programming or workshop)

## Architecture Decisions

**[CONDITIONAL - Only relevant if migration triggered]**

- **Decision: Zustand over Redux Toolkit** (Zustand)
  - **Rationale**: Simpler API reduces migration effort; team already familiar with hooks pattern; smaller bundle size; built-in DevTools
  - **Alternatives considered**: Redux Toolkit (more boilerplate), MobX (different paradigm), Recoil (Facebook experimental)
  - **Implications**: Team learns new library (2-4 hours); slight bundle increase (~1KB); DevTools support gained

- **Decision: Incremental migration vs. big bang** (Incremental, one slice at a time)
  - **Rationale**: Lower risk; allows rollback per slice; validates approach before full commitment
  - **Alternatives considered**: Migrate all at once (faster but risky), hybrid approach (Context + Zustand coexist)
  - **Implications**: Both patterns coexist temporarily (~2 weeks); requires careful dependency management

- **Decision: Maintain existing API surface** (Components unchanged)
  - **Rationale**: Migration invisible to components (reducer tests still valid); reduces blast radius; easier rollback
  - **Alternatives considered**: Refactor component APIs simultaneously (too risky), expose Zustand directly (coupling)
  - **Implications**: Zustand stores must export same action/selector API as Context; wrapper layer adds slight overhead

## Implementation Plan

**[ONLY IF TRIGGERED]**

1. **Assessment Phase (Story 19.1: 4-6 hours)**
   - Run performance profiling on current state updates (React DevTools Profiler)
   - Survey team for pain points (DevTools requests, verbosity complaints)
   - Spike: Implement `ui` slice in Zustand (compare code size, DX)
   - Decision gate: Proceed with migration or keep Context?

2. **Migration Phase (Stories 19.2-19.4: 16-24 hours)**
   - Migrate `ui` slice (smallest, lowest risk)
   - Update components using `ui` state
   - Validate tests pass, no performance regression
   - Migrate `user` slice (medium complexity)
   - Migrate `lists` slice (largest, most complex)
   - Remove all Context providers
   - Update documentation

3. **Validation Phase (2-4 hours)**
   - Load testing: Verify no performance regression
   - DevTools testing: Verify time-travel debugging works
   - Team training: Pair programming session on Zustand patterns
   - Documentation review: `code-conventions.md` updated

## Risks & Mitigations

**[ONLY IF TRIGGERED]**

- **Risk: Migration introduces bugs in critical user flows** — Severity: High
  - **Mitigation**: Incremental migration per slice; comprehensive testing per story; feature flags to disable Zustand per slice
  - **Rollback**: Revert slice-by-slice (keep both Context and Zustand code until all slices stable)

- **Risk: Performance degrades vs. Context** — Severity: Medium
  - **Mitigation**: Benchmark before/after with React Profiler; use Zustand shallow comparison for optimal re-renders
  - **Rollback**: If Zustand slower, revert to Context (unlikely based on Zustand benchmarks)

- **Risk: Team unfamiliar with Zustand patterns** — Severity: Low
  - **Mitigation**: Pair programming during first slice migration; document patterns in `code-conventions.md`; Zustand docs are excellent
  - **Rollback**: N/A (training issue, not technical)

- **Risk: Migration blocks other feature work** — Severity: High
  - **Mitigation**: Schedule during low-priority period (after Epic 14-17 complete); allocate dedicated sprint; no parallel feature work
  - **Rollback**: Pause migration if urgent feature requested; resume later

- **Risk: DevTools don't justify migration effort** — Severity: Medium
  - **Mitigation**: Validate DevTools usage in Story 19.1 assessment; only proceed if concrete debugging value demonstrated
  - **Rollback**: Keep Context if assessment shows no clear benefit

## Decision Gate: Proceed or Keep Context?

**Before starting Story 19.2, validate these triggers:**

| Trigger                      | Threshold              | Current Status        | Proceed? |
| ---------------------------- | ---------------------- | --------------------- | -------- |
| **Performance**              | State updates >100ms   | TBD (profile in 19.1) | ❓       |
| **DevTools Requests**        | 3+ developers          | 0 requests            | ❌       |
| **Cross-Slice Dependencies** | 2+ action dependencies | 0 dependencies        | ❌       |
| **Team Consensus**           | 100% agreement         | Not surveyed          | ❓       |
| **State Complexity**         | >500 lines per reducer | ~300 lines max        | ❌       |

**Decision**: If **2+ triggers** met → Proceed with migration. Otherwise → **Keep Context, defer Epic 19 indefinitely**.

---

**Related Documentation:**

- [Epic 19 Implementation](../../issue-implementation/epic-19-state-refactor/README.md)
- [Story 19.1 BR](./story-19-1-zustand-assessment.md)
- [Story 19.2 BR](./story-19-2-migrate-ui-slice.md)
- [Story 19.3 BR](./story-19-3-migrate-user-slice.md)
- [Story 19.4 BR](./story-19-4-migrate-lists-slice.md)
- [Code Conventions](../../guides/code-conventions.md)
- [Architecture Overview](../../architecture.md)

---

## **IMPORTANT: This Epic is Currently DEFERRED**

**Current state management (Context + Reducers) is working well. Do not start this epic unless pain points emerge.**

**Review this epic quarterly:**

- Q1 2026: Assess after Epic 14-17 complete
- Q2 2026: Re-evaluate if new features introduced state complexity
- Q3 2026: Survey team for pain points
- Q4 2026: Performance audit with production data

**Contact before starting:** Tech lead approval required (validate triggers met).

## Implementation notes

**⚠️ DEFERRED - Do not implement unless decision gate triggers met**

- **Conventions**: Follow `docs/guides/code-conventions.md` and `docs/guides/solid-principles.md`
- **Assessment first**: Must complete Story 19.1 assessment and validate 2+ triggers before proceeding
- **Incremental migration**: One slice at a time (ui → user → lists); keep both patterns until all slices stable
- **Rollback safety**: Maintain Context provider code for 30 days post-migration per slice
- **Team training**: Allocate 4 hours for Zustand workshop before starting Story 19.2
