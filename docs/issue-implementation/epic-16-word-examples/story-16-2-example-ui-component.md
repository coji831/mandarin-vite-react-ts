# Implementation 16-2: Example UI Component

See Business Requirements: ../../business-requirements/epic-16-word-examples/story-16-2-example-ui-component.md
See Epic Implementation: ./README.md

Last Update: 2026-04-09
Status: Planned

## Technical Scope

- Files to add/update:
  - `apps/frontend/src/features/word/components/WordExamplesPanel.tsx` (main panel)
  - `apps/frontend/src/features/word/components/ExampleListItem.tsx` (single example row)
  - `apps/frontend/src/features/word/hooks/useExamples.ts` (data fetching + cache layer)
  - `apps/frontend/src/services/examplesApi.ts` (API client wrapper)
  - `apps/frontend/src/services/ttsService.ts` (audio play helper)
  - `apps/frontend/src/features/word/__tests__/WordExamplesPanel.test.tsx` (RTL tests)
  - `apps/frontend/src/features/word/styles/WordExamples.css` (responsive styles)

## Implementation Details

Component responsibilities:

- `WordExamplesPanel` fetches examples (via `useExamples`) and renders a compact list or skeleton rows.
- `ExampleListItem` displays `chinese`, `pinyin`, `english` and a Play button.
- Play button calls `ttsService.play(exampleCacheKey)` which requests an audio URL from the backend and plays the audio.

Example `useExamples` sketch:

```ts
function useExamples(wordId) {
  return useSWR(`/api/examples?wordId=${wordId}`, fetcher, {
    dedupingInterval: 60_000,
    revalidateOnFocus: false,
  });
}
```

Play flow (user clicks Play):

1. UI calls `GET /api/examples/audio?cacheKey={key}`
2. Backend returns a signed GCS URL (if audio cached) or triggers TTS generation and returns the audio URL when ready (or 202 with polling token).
3. `ttsService` creates an `HTMLAudioElement`, sets source to signed URL, and calls `audio.play()` (user gesture satisfied).

Performance guidance:

- Cached example payloads should be returned within 500ms (network+render) on typical mobile networks; use local cache (SWR/redux) for immediate render.
- Use skeleton rows for perceived performance while fetching.

Accessibility:

- Play buttons include `aria-label="Play example 1: [chinese]"` and announce loading state.

## Architecture Integration

- Frontend calls backend endpoints created in Story 16.1 and the audio endpoint described in Story 16.1/16.3.
- Uses existing auth cookie/session flows for user-specific requests where applicable.
- Consumes the `POST /api/examples` API contract defined in Story 16.1 (request/response shapes) for fetching examples.
- Emits analytics events to the existing tracking pipeline: `examples_shown`, `example_played`.

```
[WordDetailView] -> WordExamplesPanel -> /api/examples -> cached payload (GCS) || Gemini
                                                         -> /api/examples/audio -> signed GCS URL (on-demand TTS)
```

## Technical Challenges & Solutions

Problem: iOS/mobile will block audio autoplay unless triggered by a user gesture.
Solution: Ensure `audio.play()` is invoked inside the Play button click handler and surface graceful fallback if playback fails.

Problem: Hitting performance budget (500ms) on slow networks.
Solution: Use local caching (SWR), skeletons, and avoid heavy DOM operations; prefer CSS transitions.

Problem: Race conditions when multiple plays request the same audio simultaneously.
Solution: `ttsService` tracks in-flight audio requests and returns the same promise for concurrent callers.

## [Optional] Testing Implementation

- Unit tests with Vitest/RTL for `WordExamplesPanel` and `ExampleListItem`.
- Mock network: stub `/api/examples` and `/api/examples/audio` to assert UI behavior for cached vs. generation-in-progress.
- Manual verification: mobile responsiveness, touch target sizes, and playback on iOS/Android devices.
