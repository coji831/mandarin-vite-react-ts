# Implementation 11.5: Implement and Document Backend Swap & Fallback

## Technical Scope

All services (VocabularyDataService, AudioService) now support backend swap via dependency injection (DI) through their constructors. Fallback logic is robust and tested. See code comments in src/features/mandarin/services/interfaces.ts for detailed documentation of the backend swap/fallback pattern.

## Implementation Details

### Example Backend Swap Pattern

```typescript
// Custom backend implementation
class CustomBackend implements IVocabularyBackend {
  fetchLists() {
    /* ... */
  }
  fetchWords(list) {
    /* ... */
  }
}
const svc = new VocabularyDataService(new CustomBackend());
svc.fallbackService = new VocabularyDataService(new LocalCacheBackend());
```

All services support backend swap via config or DI. Fallback logic is implemented and tested. Documentation is updated in code and `docs/`.

## Architecture Integration

```
[Service Layer] → config/DI → [Primary Backend | Fallback Backend | Local Cache]
```

## Technical Challenges & Solutions

- **Ensuring all services support backend swap:** Used constructor injection/config pattern for all services.
- **Testing fallback logic:** Wrote unit tests for all fallback scenarios, including backend swap and fallbackService.

## Testing Implementation

Unit tests for backend swap and fallback logic in all services are included in **tests** for VocabularyDataService and AudioService. All tests pass.

---

**Cross-references:**

- [Business Requirements for Story 11.5](../../business-requirements/epic-11-service-layer-overhaul/story-11-5-backend-swap-fallback.md)
- [Epic 11 README](../../business-requirements/epic-11-service-layer-overhaul/README.md)

**Status:** Complete
**Owner:** GitHub Copilot
**Last updated:** 2025-11-10

---

_Last updated: 2025-11-10_
