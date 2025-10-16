# Epic: Async Caching & Fetch Optimization (Phase 4)

## Summary

Add lightweight in-memory caching for async operations (CSV loads, API fetches) to reduce parsing and network overhead in-session. Cache entries should be keyed and optionally ttl-based to avoid stale data.

## Goals

- Implement simple cache utilities in `src/features/mandarin/services/` or `src/features/mandarin/utils/`.
- Use cache for CSV loading and any repeated data operations.
- Expose `getCachedList(listId)` and `prefetchList(listId)` helper APIs.

## Scope

Files to add/update:

- `src/features/mandarin/services/cache.ts` (in-memory cache)
- Integrate cache usage in `src/features/mandarin/hooks/*` where CSV/API loading occurs

## Constraints

- Session-only in-memory cache (no persistence). Keep TTL optional.
- No external libs.

## Acceptance Criteria

- Repeated requests for the same list in a session result in a single CSV parse / network call.
- Unit tests for cache hit/miss behavior.

## Risks & Mitigations

- Risk: memory usage growth on long sessions. Mitigation: add TTL and max-entries eviction policy.

## Metrics

- Number of network/parse calls per session for key flows (before/after).
- Average latency for loading a list on repeated access.
