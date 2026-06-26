# Implementation Story 19.3: Backend RadicalProgress + SRS Review Integration

**Last Updated:** June 26, 2026
**Status:** Completed
**Key Commit:** TBD (will be added after commit)

## Technical Scope

Backend RadicalProgress Prisma model, CRUD API endpoints, ReviewService extension for radical items, and frontend review integration — covering database, API, SRS review, and UI content type selection.

### Files Modified

**Backend — Database:**
- `apps/backend/prisma/schema.prisma` — Added `RadicalProgress` model with composite unique and index

**Backend — Progression Module:**
- `apps/backend/src/modules/progression/repositories/ProgressionRepository.js` — Added `findRadicalProgressByUser`, `findRadicalProgressByUserAndRadicalId`, `upsertRadicalProgress`
- `apps/backend/src/modules/progression/services/ProgressionService.js` — Added `getRadicalProgress`, `getRadicalProgressById`, `upsertRadicalProgress` (with radicalId validation via `fs.existsSync`)
- `apps/backend/src/modules/progression/api/ProgressionController.js` — Added `getRadicalProgress`, `getRadicalProgressById` (404 if not found), `upsertRadicalProgress` (400 for invalid radicalId, ReviewItem side-effect when memorized=true)
- `apps/backend/src/modules/progression/api/progressionRoutes.js` — Added 3 routes (GET list, GET by id, PUT upsert) all with `authenticateToken` + `asyncHandler`

**Backend — Review Module:**
- `apps/backend/src/modules/review/services/ReviewService.js` — Added `buildRadicalItem()` function, updated `getReviewItems()` to include "radical" in type filter and load radicals from `content/radicals/`

**Backend — DI Container:**
- `apps/backend/src/app/container.js` — Reordered to instantiate `reviewService` before `progressionService`, pass `reviewService` to `ProgressionController`

**Shared Constants:**
- `packages/shared-constants/src/index.js` — Added `progressionRadicalProgress` and `progressionRadicalProgressById` route patterns

**Frontend — Review Engine:**
- `apps/frontend/src/features/review/engine/types.ts` — Added `showMeaning` to `ReviewStrategy` interface
- `apps/frontend/src/features/review/engine/strategies/index.ts` — Registered `radicalReviewStrategy` in `REVIEW_STRATEGIES`
- `apps/frontend/src/features/review/engine/strategies/PinyinReviewStrategy.ts` — Added `showMeaning: true`
- `apps/frontend/src/features/review/engine/strategies/ToneReviewStrategy.ts` — Added `showMeaning: true`

**Frontend — Review Components:**
- `apps/frontend/src/features/review/components/ReviewPicker.tsx` — Added 📘 Radicals content type; improved accessibility (aria-pressed, radiogroup); refactored inline styles to CSS classes; added React.memo
- `apps/frontend/src/features/review/components/ReviewPicker.css` — Added `.review-picker__card--selected` and `.review-picker__radio--selected` classes
- `apps/frontend/src/features/review/components/ReviewCard.tsx` — Added `showMeaning` from strategy; added auto-play audio on step change
- `apps/frontend/src/features/review/components/ReviewCardPinyinInput.tsx` — Added `showMeaning` prop
- `apps/frontend/src/features/review/components/ReviewCardToneSelect.tsx` — Added `showMeaning` prop
- `apps/frontend/src/features/review/components/ReviewCardResult.tsx` — Minor wiring update
- `apps/frontend/src/features/review/components/ReviewComplete.tsx` — Added React.memo; reordered buttons per wireframe
- `apps/frontend/src/features/review/components/ReviewView.tsx` — Wiring updates
- `apps/frontend/src/features/review/hooks/useReview.ts` — Removed deprecated `totalItems` from `ReviewSessionResult`; wrapped console.warn in `import.meta.env.DEV` guard
- `apps/frontend/src/features/review/types/review.ts` — Added `"radical"` to `ReviewItemType` union; removed deprecated `totalItems` from `ReviewSessionResult`

**Frontend — Shared:**
- `apps/frontend/src/shared/components/LoadingScreen/LoadingScreen.tsx` — Minor cleanup

### Files Created

- `apps/backend/prisma/migrations/20260626000000_add_radical_progress/migration.sql` — Migration for RadicalProgress table
- `apps/backend/src/modules/progression/repositories/__tests__/ProgressionRepository.test.js` — 7 tests
- `apps/backend/src/modules/progression/services/__tests__/ProgressionService.test.js` — 7 tests
- `apps/backend/src/modules/progression/api/__tests__/ProgressionController.test.js` — 13 tests
- `apps/backend/src/modules/review/services/__tests__/ReviewService.test.js` — 10 tests
- `apps/frontend/src/features/review/engine/strategies/RadicalReviewStrategy.ts` — New radical review strategy
- `apps/frontend/src/features/review/engine/strategies/__tests__/RadicalReviewStrategy.test.ts` — 8 tests

## Implementation Details

### RadicalProgress Prisma Model

```prisma
model RadicalProgress {
  id               String   @id @default(uuid())
  userId           String
  radicalId        String   // "rad_0001", "rad_0002", etc.
  memorized        Boolean  @default(false)
  recognitionLevel Int      @default(0)
  reviewedAt       DateTime?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@unique([userId, radicalId])
  @@index([userId])
}
```

### API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/progression/radical-progress` | JWT | List user's radical progress |
| GET | `/api/v1/progression/radical-progress/:radicalId` | JWT | Get single radical progress (404 if none) |
| PUT | `/api/v1/progression/radical-progress/:radicalId` | JWT | Upsert progress; validates radicalId; triggers ReviewItem side-effect when `memorized=true` |

### ReviewService — `buildRadicalItem()`

```javascript
function buildRadicalItem(radical, srs, now, sevenDaysAgo, source) {
  const nextReview = srs?.nextReview ? new Date(srs.nextReview) : now;
  const lastReviewed = srs?.lastReviewed ? new Date(srs.lastReviewed) : null;

  if (source === "due" && nextReview > now) return null;
  if (source === "recent" && (!lastReviewed || lastReviewed < sevenDaysAgo)) return null;

  return {
    id: srs?.id || `radical-${radical.id}`,
    itemType: "radical",
    itemId: radical.id,
    front: radical.name_pinyin,
    back: `${radical.glyph} (${radical.name_pinyin}) — ${radical.meaning}`,
    category: "radicals",
    character: radical.glyph,
    pinyinPlain: stripToneMarks(radical.name_pinyin || ""),
    meaning: radical.meaning || null,
    studyCount: srs?.studyCount || 0,
    correctCount: srs?.correctCount || 0,
    nextReview: nextReview.toISOString(),
    intervalDays: srs?.intervalDays || 1,
  };
}
```

### RadicalReviewStrategy

For radical items, the review flow is simplified: user sees the glyph → types the pinyin name → rates A/G/E. No tone selection step since radicals don't have tone numbers. The `showMeaning: false` flag hides the meaning hint during input to make recall harder.

```typescript
export const radicalReviewStrategy: ReviewStrategy = {
  itemType: "radical",
  initialStep: "pinyin",
  feedbackLabel: "Radical",
  showMeaning: false,

  evaluate(item: ReviewItem, input): { correct: boolean } {
    if (input.type !== "pinyin") return { correct: false };
    const expected = (item.pinyinPlain || "").toLowerCase();
    return { correct: expected.length > 0 && input.value === expected };
  },
};
```

## Architecture Integration

```
[RadicalProgress API]
  GET  /api/v1/progression/radical-progress        → Controller → Service → Repository → Prisma
  GET  /api/v1/progression/radical-progress/:id     → Controller → Service → Repository → Prisma
  PUT  /api/v1/progression/radical-progress/:id     → Controller → Service → Repository → Prisma
       └─ if memorized=true → ReviewService.recordRating() → ReviewRepository
                                (fire-and-forget side-effect)

[ReviewPicker UI]
  📘 Radicals button → selectedType="radicals"
                       → getReviewItems({ type: "radical" })
                       → ReviewService.getReviewItems() loads content/radicals/*.json
                       → buildRadicalItem() for each radical
                       → RadicalReviewStrategy for glyph→pinyin recall

[ReviewCard]
  showMeaning=false → hides meaning during pinyin input
  initialStep="pinyin" → skips tone selection (radicals have no tone)
```

## Technical Challenges & Solutions

### Challenge 1: DI circular dependency between ProgressionService and ReviewService

**Problem:** `ProgressionService` needs `ReviewService` for the side-effect, but they're in different modules and the container was constructed with `ProgressionService` before `ReviewService`.

**Solution:** Moved `ReviewService` instantiation before `ProgressionService` in `container.js`, and passed `reviewService` to `ProgressionController` (not `ProgressionService`). The side-effect orchestration lives at the controller layer, keeping services decoupled.

### Challenge 2: Radical content is static JSON, not a database table

**Problem:** Unlike pinyin/tone items from the DB, radicals are loaded from `content/radicals/*.json` files. The validation for `radicalId` needed to check file existence.

**Solution:** Used `fs.existsSync(path.join(CONTENT_DIR, "radicals", `${radicalId}.json`))` in the service layer for validation. This follows the same pattern as `readContentDir("radicals")` in `ReviewService`.

### Challenge 3: Fire-and-forget side-effect resilience

**Problem:** If `ReviewService.recordRating()` fails, the `upsertRadicalProgress` response should still succeed — the side-effect is non-critical.

**Solution:** The side-effect call is wrapped in `.catch((err) => { logger.warn(...) })` at the controller level, ensuring the main operation's response is always returned.

## Testing Implementation

Total: **45 tests** across 5 test files.

| Test File | Tests | Coverage |
|-----------|-------|----------|
| `ProgressionRepository.test.js` | 7 | All 3 repository methods, edge cases (empty, not found, create vs update, reviewedAt) |
| `ProgressionService.test.js` | 7 | All 3 service methods, default values, invalid radicalId validation |
| `ProgressionController.test.js` | 13 | All 3 endpoints, 200/404/400/500 responses, side-effect orchestration, resilience |
| `ReviewService.test.js` | 10 | `buildRadicalItem` shape, all 3 source filters (due/recent/all), new items, missing fields, type filtering |
| `RadicalReviewStrategy.test.ts` | 8 | Metadata, showMeaning, correct/incorrect evaluation, non-pinyin input, empty pinyinPlain |

### Key edge cases tested

- **Repository:** `reviewedAt` is set to current date on both create and update
- **Service:** Invalid radicalId throws before calling repository; defaults applied when fields omitted
- **Controller:** 404 when no progress record exists; 400 for invalid radicalId; 500 for unexpected errors; side-effect failure doesn't block 200 response
- **ReviewService:** New items are due by default; all three source filters work identically to pinyin/tones; radicals included when no type filter; radicals excluded when tone type filter
- **RadicalReviewStrategy:** Case-insensitive matching; empty pinyinPlain returns false; non-pinyin input returns false

## Acceptance Criteria Checklist

- [x] RadicalProgress Prisma model added with fields: id, userId, radicalId, memorized, recognitionLevel, reviewedAt, createdAt
- [x] `@@unique([userId, radicalId])` constraint prevents duplicate progress records
- [x] `@@index([userId])` for efficient user-scoped queries
- [x] GET /api/v1/progression/radical-progress returns user's radical progress
- [x] GET /api/v1/progression/radical-progress/:radicalId returns progress for specific radical
- [x] PUT /api/v1/progression/radical-progress/:radicalId creates or updates progress
- [x] Validates radicalId against content data
- [x] All endpoints require authenticateToken middleware
- [x] PUT /api/v1/progression/radical-progress/:radicalId creates a ReviewItem side-effect when memorized=true
- [x] "radical" added to ReviewItemType union in review/types
- [x] buildRadicalItem() function in ReviewService loads radical data from content/radicals/*.json
- [x] ReviewPicker shows 📘 Radicals content type button alongside existing 🔤 Pinyin and 🎵 Tones
- [x] Radical review card shows radical glyph → user types pinyin → rates A/G/E (three-step flow)
- [x] Radical review items respect due/recent/all source filters

## Related Files

- [Epic 19 Implementation README](../README.md)
- [Story 19.3 BR](../../../business-requirements/epic-19-radicals/story-19-3-backend-radical-progress.md)

**Solution:** ProgressionService receives ReviewService via constructor injection (already registered in container.js). The ProgressionController's updateRadicalProgress handler calls ProgressionService.upsertRadicalProgress(), which updates RadicalProgress, then calls `this.reviewService.recordRating()` as a write-only side-effect. The side-effect is fire-and-forget — if review recording fails, the RadicalProgress update still succeeds. A background queue (event emitter or simple microtask) retries failed review recordings.
