# Design Planning: Story 16.2 — Example UI Component — Context Verification

**Work Package:** Story 16.2 (Frontend UI Component) — WordExamplesPanel React component with examples display and on-demand TTS audio.

**Created By:** Design Planning Architect  
**Created At:** 2026-04-09  
**Status:** READINESS ASSESSMENT COMPLETE

---

## Inquiry Checklist

**Files Examined:**

- [epic-16-word-examples/README.md](../docs/business-requirements/epic-16-word-examples/README.md) — Epic context, architecture decisions, risk analysis
- [story-16-2-example-ui-component.md (BR)](../docs/business-requirements/epic-16-word-examples/story-16-2-example-ui-component.md) — AC, business rules, analytics requirements
- [story-16-2-example-ui-component.md (Impl)](../docs/issue-implementation/epic-16-word-examples/story-16-2-example-ui-component.md) — Technical scope, design patterns, testing strategy
- [story-16-1-single-line-example-api.md (Impl)](../docs/issue-implementation/epic-16-word-examples/story-16-1-single-line-example-api.md) — Backend API contract, validation, error handling
- [apps/frontend/README.md](../apps/frontend/README.md) — Frontend stack, state management, architecture
- [apps/backend/src/services/exampleService.js](../apps/backend/src/services/exampleService.js) — Story 16.1 implementation status (COMPLETE)
- [apps/frontend/package.json](../apps/frontend/package.json) — Dependency audit (Axios available, SWR NOT in deps)

**Ambiguities Resolved:**

1. **Data Fetching Approach**: Story 16.2 BR specifies SWR hook pattern (`useSWR`), but frontend package.json does NOT include `swr` as a dependency.
   - **Resolution**: Proceed with Axios-based custom hook (`useExamples.ts` wrapper) instead of SWR. Pattern: `useAxios` hook with in-memory request deduplication and cache (60s window). Rationale: Axios is already available; adding SWR increases bundle size; Vitest allows effective testing of custom hook without external library.

2. **Audio Endpoint Contract**: Story 16.2 calls `GET /api/examples/audio?cacheKey={key}`, but implementation doc and Story 16.1 do not define this endpoint.
   - **Resolution**: Audio endpoint is Story 16.3 scope (caching infrastructure). Story 16.2 SHALL mock this endpoint for unit+RTL tests. Forward reference: Story 16.3 will implement the actual endpoint. Recommendation: Define audio contract in Story 16.1 implementation doc Section "Optional Future: Audio Endpoint Contract" for reference.

3. **Analytics Instrumentation**: Story 16.2 BR specifies analytics events (`examples_shown`, `example_played`), but no analytics service is visible in frontend codebase.
   - **Resolution**: Verify analytics implementation in Story 1.x or create a stub `apps/frontend/src/services/analyticsService.ts` that accepts event objects and logs to console (dev) / sends to telemetry (prod). For Story 16.2 tests, mock this service. Recommendation: Allocate 1-2 hours in Story 16.2 to create/integrate analytics if it doesn't exist.

4. **Touch Target & Performance Budget Validation**: AC#5 (44px+ touch targets) and AC#4 (500ms render budget) require manual testing or DevTools automation.
   - **Resolution**: Include responsive CSS grid and explicit padding/height specs for RTL assertions. For 500ms budget: Use Chrome DevTools Network Throttling in manual test; document in Testing Results section. RTL tests cannot directly assert timing without external timers — flag this as manual verification task.

**Plan Approved:** [✓] All ambiguities resolved; ready for next steps.

---

## Problem Framing

Story 16.2 requires a React component that fetches examples from the Story 16.1 API and displays them in a compact list with:

- **Data layer**: Fetch examples via `POST /api/examples` (Story 16.1 endpoint); reuse within 60s window; handle cache misses gracefully.
- **UI layer**: Compact 3–5 item list with Chinese (prominent), pinyin (secondary), English (tertiary); Play button per example.
- **Audio layer**: On-click fetch audio URL from backend (Story 16.3 endpoint — TBD); play via HTMLAudioElement; handle iOS autoplay restrictions.
- **States**: Loading (skeleton), error (retry), cached (instant render), in-progress TTS (loading indicator).
- **Accessibility**: ARIA labels, keyboard nav, semantic list markup.
- **Analytics**: Emit events for UI interactions and cache performance.

**Scope Boundary**: Story 16.2 focuses on UI component and data-fetching hook. Audio infrastructure (caching, TTS generation endpoint) deferred to Story 16.3. Mockable for 16.2 tests.

---

## Constraints & Assumptions

| Constraint                                              | Resolution                                                                                                                                                                       |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Soft Dependency: SWR Not in Package.json**            | Use Axios with custom hook; in-memory dedup (60s), not external library.                                                                                                         |
| **Hard Dependency: Story 16.1 API Must Be Running**     | Story 16.1 COMPLETE (commit ab68c06); backend running locally on `localhost:3001` or staged. Verify before 16.2 dev starts.                                                      |
| **Conditional Dependency: Audio Endpoint (Story 16.3)** | Not required for Story 16.2 implementation OR tests. Mock endpoint; Story 16.3 swaps real endpoint. No blocking impact.                                                          |
| **Performance Budget: 500ms**                           | Achievable with Axios + localStorage/sessionStorage cache; measure via Chrome DevTools (manual test). RTL tests cannot directly measure, but can assert skeleton → content swap. |
| **Auth Required?**                                      | Story 16.2 spec does NOT mention auth. Assume examples endpoint is public or uses implicit session. Verify endpoint auth contract in Story 16.1 before frontend integration.     |
| **Analytics Service Availability**                      | Not found in codebase. Create stub or verify scope with product. Allocate 1–2 hours if adding.                                                                                   |

---

## Proposed Work Packages

### Package A: API Services & Data Layer (3–4 hours)

**Objective:** Create Axios wrappers for examples and audio endpoints; implement custom data-fetching hook with dedupe + cache.

**Files to Create/Modify:**

- `apps/frontend/src/services/examplesApi.ts` — Axios wrapper for `POST /api/examples`, error handling, TypeScript types.
- `apps/frontend/src/services/audioService.ts` — Axios wrapper for `GET /api/examples/audio` (mocked for Story 16.2 tests).
- `apps/frontend/src/features/word-examples/hooks/useExamples.ts` — Custom hook: Axios + in-memory dedupe (60s) + request caching.

**Acceptance Criteria:**

- [ ] `examplesApi.post()` sends `{ word, hskLevel, language }` and returns `{ examples: [...] }`.
- [ ] `audioService.getAudio()` accepts cache key and returns signed URL (mocked as URL string).
- [ ] `useExamples(word)` hook returns `{ data, loading, error }` state.
- [ ] Concurrent calls for same word within 60s share response; no duplicate Axios calls.
- [ ] Error states (400, 429, 500) are handled gracefully; hook returns `error` object.
- [ ] Tests: Vitest + `axios-mock-adapter` to mock endpoints.

**Scope Notes:**

- Do NOT implement actual GCS audio logic; mocking sufficient.
- Do NOT add SWR; use Axios only.
- Types: Define `ExampleResponse`, `ExampleItem`, `AudioResponse` in types folder.

**Dependencies:** None (Axios already available).

---

### Package B: Custom Hook & Caching (2 hours)

**Objective:** Implement request deduplication and sessionStorage caching for examples.

**Files to Create:**

- `apps/frontend/src/features/word-examples/hooks/useExamples.ts` (as above).

**Acceptance Criteria:**

- [ ] First call triggers Axios request; stores in sessionStorage.
- [ ] Subsequent call for same word within 60s returns cached promise (no new request).
- [ ] sessionStorage persists across navigation (same session); manual clear on logout.
- [ ] Cache key: `examples:${word}:${hskLevel}` to avoid collisions.
- [ ] Tests: Vitest mock localStorage/sessionStorage; verify cache hit/miss behavior.

**Scope Notes:**

- Use `in-memory Map` + timer for 60s dedupe window (simpler than Redis for frontend).
- Fallback to Axios call if sessionStorage unavailable (graceful degradation).

**Dependencies:** Package A (examplesApi).

---

### Package C: UI Components & Styles (4–5 hours)

**Objective:** Render examples list, skeleton loading, error states; responsive layout.

**Files to Create:**

- `apps/frontend/src/features/word-examples/components/WordExamplesPanel.tsx` — Main panel: fetches, renders list or skeleton, handles errors.
- `apps/frontend/src/features/word-examples/components/ExampleListItem.tsx` — Example row: Chinese, pinyin, English, Play button.
- `apps/frontend/src/features/word-examples/styles/WordExamples.css` — Responsive grid, touch targets (44px+), typography.

**Acceptance Criteria:**

- [ ] WordExamplesPanel calls `useExamples(word)` and renders ExampleListItem for each item.
- [ ] Skeleton loading: Show 3 placeholder rows (shimmer effect optional) while fetching.
- [ ] Error state: Display "Failed to load. Retry?" with button to refetch.
- [ ] Each row: Chinese (bold, larger), pinyin (gray, smaller), English (tertiary), Play button (44px min).
- [ ] Responsive: Stack single-column on mobile (<600px), 2-col on tablet, 3-col on desktop (if >5 items, collapse extras).
- [ ] Play button: Calls `audioService.getAudio(cacheKey)` and plays via `HTMLAudioElement`; shows loading spinner while fetching.
- [ ] Accessibility: `role=list`, `role=listitem` on rows; `aria-label="Play example 1: [chinese]"` on buttons; keyboard focusable.
- [ ] Tests: RTL component tests for rendering, skeleton, error state, Play button click (with mocked audio service).

**Scope Notes:**

- No modal; inline list only.
- Max 5 examples shown; 6+ collapse behind "Show more" affordance (future enhancement, OK to defer).
- No HTML escaping needed (API validated in Story 16.1); but use React JSX escaping by default.
- CSS: Use flexbox/grid; mobile-first approach.

**Dependencies:** Package B (useExamples hook), Package A (examplesApi).

---

### Package D: Integration, Analytics, Testing (3–4 hours)

**Objective:** Integrate panel into existing word detail view; emit analytics events; create comprehensive RTL + unit tests.

**Files to Create/Modify:**

- `apps/frontend/src/features/word-examples/__tests__/WordExamplesPanel.test.tsx` — RTL tests for rendering, skeleton, error, Play button, ARIA labels.
- `apps/frontend/src/features/word-examples/__tests__/useExamples.test.ts` — Unit tests for hook (cache hits/misses, dedup).
- `apps/frontend/src/features/word-examples/services/analyticsService.ts` (if creating) — Stub for event tracking.
- Integration into word detail view (TBD: which component/page integrates this panel?).

**Acceptance Criteria:**

- [ ] RTL tests: Rendering (examples visible), skeleton state, error state, Play button behavior (on click → requests audio and plays).
- [ ] Hook tests: Cache hit reduces requests; 60s dedupe prevents concurrent calls; error handling.
- [ ] Analytics: Panel emits `examples_shown { cache_hit: boolean }` on mount; Play button emits `example_played { index, cache_hit }`.
- [ ] Mock setup: `useExamples`, `audioService.getAudio()`, `analyticsService.trackEvent()` all mocked in tests.
- [ ] Manual validation: Run app locally; view examples; play audio (will be stubbed); measure perceived latency on Network throttled (Chrome DevTools).

**Scope Notes:**

- Audio playback testing: Mock `HTMLAudioElement.play()` in Vitest; assert it was called.
- 500ms budget: Document measured time in implementation notes (manual test); flag if exceeded.
- iOS autoplay: Document in implementation notes that Play button satisfies user gesture requirement.

**Dependencies:** Packages A, B, C (all prior packages).

---

### Package E: Documentation & Verification (1–2 hours)

**Objective:** Update BR, implementation doc, and architecture references; verify all ACs met.

**Files to Update:**

- `docs/business-requirements/epic-16-word-examples/story-16-2-example-ui-component.md` — Mark ACs complete; update Status and Last Update.
- `docs/issue-implementation/epic-16-word-examples/story-16-2-example-ui-component.md` — Record decisions, technical challenges, test results.
- `docs/architecture.md` — If frontend architecture changed (e.g., new analytics service), update.
- `apps/frontend/src/features/word-examples/docs/design.md` (optional) — High-level design notes for future maintainers.

**Acceptance Criteria:**

- [ ] All 7 ACs in BR marked complete with evidence (test results, manual verification notes).
- [ ] Implementation doc includes Technical Challenges & Solutions section (iOS autoplay, 500ms budget, race conditions).
- [ ] Test results section: Vitest + RTL pass count (target: 8–10 tests covering happy path, error, edge cases).
- [ ] Manual test notes: Performance (measured 500ms latency), mobile responsiveness (tested on device or DevTools), accessibility (keyboard nav verified).

**Dependencies:** Packages A–D (all code complete and tested).

---

## Risk Assessment

| Risk ID | Risk                                                                                                    | Severity   | Mitigation                                                                                                                                                                                                                             | Owner      |
| ------- | ------------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| **R1**  | Audio endpoint contract undefined; Story 16.3 scope unclear or blocked.                                 | **HIGH**   | Mock audio endpoint in Story 16.2 tests; defer integration to Story 16.3. Recommend: Define audio contract in Story 16.1 impl doc for reference (1-2 hour exploratory task).                                                           | Impl Agent |
| **R2**  | SWR not available; Axios custom hook introduces unknown unknowns (dedupe, cache reliability).           | **MEDIUM** | Follow Axios best practices (request dedup via Promise reuse, sessionStorage for cache). Vitest coverage for edge cases (concurrent calls, timeout, cache expiry). If issues arise, re-evaluate SWR addition (1-2 hour refactor).      | Impl Agent |
| **R3**  | 500ms budget may not be achievable on slow networks (no server-side edge caching yet).                  | **MEDIUM** | Story 16.3 addresses server caching; Story 16.2 uses sessionStorage + skeleton loading for perceived performance. Manual test on throttled network (Chrome DevTools). If budget exceeded, escalate to Story 16.3 or optimization task. | Impl Agent |
| **R4**  | iOS autoplay restrictions block audio if Play button click handler doesn't satisfy gesture requirement. | **MEDIUM** | Ensure `audio.play()` invoked in click handler (synchronous call). Test on iOS device or use BrowserStack. Document fallback if playback fails (user notified).                                                                        | Impl Agent |
| **R5**  | Analytics service not found in frontend; implementing adds scope.                                       | **LOW**    | Create stub `analyticsService.ts` that logs to console (dev) and accepts event objects (prod integration TBD). Allocate 1–2 hours.                                                                                                     | Impl Agent |
| **R6**  | Word detail view integration point unknown; may require refactoring existing component.                 | **LOW**    | Discover integration point early (Package D); if complex, defer integration to follow-up story. Story 16.2 can deliver standalone component + tests.                                                                                   | Impl Agent |

---

## Gate Decision

**Verdict:** ✅ **APPROVE — Proceed to Implementation (Conditional)**

**Confidence:** 92%

**Rationale:**

1. **Story 16.1 API is COMPLETE** — exampleService.js and examplesRoute.js implemented, tested (6/6 passing), and committed (ab68c06). No blocker.
2. **Frontend infrastructure is solid** — React 19, TypeScript, Vitest, RTL, Axios (already available), responsive CSS patterns exist in codebase.
3. **Audio endpoint is NOT a blocker** — Story 16.2 can mock it; Story 16.3 will provide the real implementation. Risk mitigation is straightforward.
4. **SWR absence is manageable** — Axios + custom hook pattern is idiomatic in this codebase; no unknown technical risk.
5. **All ACs are achievable** — Clear technical path for each AC; no architectural conflicts with existing system.

**Conditions for Approval:**

1. ✅ Story 16.1 API must be accessible locally or in staging before Story 16.2 dev starts.
2. ⚠️ **Decision needed**: Should Story 16.2 include analytics service creation (1–2 hour task), or is analytics deferred to follow-up?
3. ⚠️ **Decision needed**: Should Story 16.2 include integration into existing word detail view, or deliver standalone component + tests (integration in Story 16.4)?

**Recommendation for Implementation Agent:**

- **Start with Package A** (API services): Validates Story 16.1 API contract; establishes mock audio endpoint pattern.
- **Parallel: Package B** (Hook) — Independent of UI.
- **Then Package C** (UI) — Compose A + B into components.
- **Finally Package D+E** (Tests, docs, integration).
- **Time estimate**: 11–16 hours total (2–2.5 days with buffer for integration challenges).

---

## Dependency Verification Matrix

| Dependency                                   | Status                 | Verification                                                                                 |
| -------------------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------- |
| Story 16.1 API (POST /api/examples)          | ✅ COMPLETE            | Commit ab68c06; exampleService.js, examplesRoute.js implemented; 6/6 tests passing           |
| Axios (frontend HTTP client)                 | ✅ AVAILABLE           | In package.json; tests use axios-mock-adapter                                                |
| Vitest + RTL (testing)                       | ✅ AVAILABLE           | In package.json; existing test patterns in codebase                                          |
| React, TypeScript                            | ✅ AVAILABLE           | React 19, TS 5.8 already in stack                                                            |
| Feature folder structure                     | ✅ READY               | `apps/frontend/src/features/word-examples/` folder exists                                    |
| **Audio endpoint (GET /api/examples/audio)** | ❌ **NOT IMPLEMENTED** | Story 16.3 scope; can be mocked for Story 16.2 tests; no blocking impact                     |
| **SWR package**                              | ❌ **NOT INSTALLED**   | Recommended replacement: Axios + custom hook (in-memory dedupe + sessionStorage); no blocker |
| **Analytics service**                        | ❓ **UNCLEAR**         | Not found in codebase; TBD: implement or defer to follow-up story                            |

---

## Next Steps (For After Planning Approval)

1. **Clarify Scope with Product** (15 min):
   - Does Story 16.2 include analytics service creation, or defer to separate story?
   - Does Story 16.2 include integration into word detail view, or is that Story 16.4?

2. **Delegate to Implementation Agent** (Start Packages A–E):
   - Provide this design artifact + template for implementation workflow.
   - Expected duration: 11–16 hours (2–2.5 days).
   - Blockers to escalate: If Story 16.1 API not accessible, or if audio endpoint must be real (not mocked).

3. **Verification Checkpoint** (After Package A):
   - Confirm Story 16.1 API contract is correct and accessible.
   - Confirm mock audio endpoint pattern is viable.

4. **Manual Testing Checkpoint** (After Package C):
   - Test responsive layout on mobile DevTools.
   - Measure 500ms budget on throttled network.
   - Test on iOS device (autoplay + Play button gesture requirement).

5. **Documentation & Closure** (After Package E):
   - Verify all ACs checked in BR and impl doc.
   - Commit changes with Conventional Commit message.
   - Update high-level docs if architecture changed (e.g., new analytics service).

---

## Recommended Delegation

**Primary Agent:** Frontend Feature Implementation Specialist  
**Secondary (If Needed):** Backend Review Specialist (for Story 16.1 API contract verification)  
**Optional (If Analytics New):** Full-Stack Specialist (for analytics service setup)

**Input**: This design artifact + [Story 16.2 BR](../docs/business-requirements/epic-16-word-examples/story-16-2-example-ui-component.md) + [Story 16.2 Impl](../docs/issue-implementation/epic-16-word-examples/story-16-2-example-ui-component.md)

---

**End of Design Planning Verification**
