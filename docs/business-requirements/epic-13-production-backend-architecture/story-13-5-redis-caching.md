# Story 13.5: Redis Caching Layer

## Description

**As a** developer,
**I want to** implement Redis caching for API responses,
**So that** repeated requests are faster and reduce external API costs.

## Business Value

Implementing strategic caching reduces external API costs (Google TTS, Gemini) by >50% and improves user experience with faster response times. This directly improves profit margins by reducing per-user operational costs and enables the system to scale to more concurrent users without hitting rate limits.

## Acceptance Criteria

- [x] Redis client configured with graceful fallback when unavailable
- [x] CachedTTSService wraps TTSService with caching (24-hour TTL)
- [x] Conversation responses cached with 1-hour TTL
- [x] Cache hit/miss rates logged for monitoring
- [x] Cache hit rate >50% verified under load testing (100 concurrent users)
- [x] API response times <200ms p95 for cache hits, <2s p95 for misses
- [x] System functions correctly when Redis is unavailable (degrades gracefully)

## Business Rules

1. Cache keys must include all relevant parameters to prevent incorrect cache hits
2. Cache must be invalidated when vocabulary data is updated
3. Cache misses must not block user requests (fail open, not closed)
4. Personal user data (progress) must never be cached in shared Redis

## Related Issues

- [Epic 13: Production Backend Architecture](./README.md) (Parent epic)
- [Story 13.4: Multi-User Progress API](./story-13-4-progress-api.md) (Can run in parallel)
- [Story 13.6: Clean Architecture Preparation](./story-13-6-clean-architecture.md) (Can run in parallel)

## Implementation Status

- **Status**: Completed
- **Branch**: epic-13-production-backend-architecture
- **Commits**: bb70a7f, 3cfbaed, bcae1d0, 853b774, 82ab568, b7e950c
- **Last Update**: 2026-01-22
