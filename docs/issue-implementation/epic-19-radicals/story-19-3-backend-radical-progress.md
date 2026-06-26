# Implementation 19-3: Backend RadicalProgress + SRS Review Integration

**Last Updated:** June 26, 2026

## Technical Scope

Add RadicalProgress Prisma model, API endpoints (GET/PUT), ReviewItem side-effect on memorized=true, extend ReviewService with buildRadicalItem(), add "radical" to ReviewItemType, and update ReviewPicker with [📘 Radicals] content type.

**Files to create:**

- `apps/backend/prisma/migrations/` — migration for RadicalProgress model
- (Backend methods added to existing files below)

**Files to modify:**

- `apps/backend/prisma/schema.prisma` — add RadicalProgress model
- `apps/backend/src/modules/progression/api/ProgressionController.js` — add radical-progress handler methods
- `apps/backend/src/modules/progression/api/progressionRoutes.js` — add radical-progress routes
- `apps/backend/src/modules/progression/repositories/ProgressionRepository.js` — add radical-progress DB methods
- `apps/backend/src/modules/progression/services/ProgressionService.js` — add upsertRadicalProgress with ReviewItem side-effect
- `apps/backend/src/modules/review/services/ReviewService.js` — add buildRadicalItem()
- `apps/frontend/src/features/review/types/review.ts` — add "radical" to ReviewItemType union
- `apps/frontend/src/features/review/components/ReviewPicker.tsx` — add 📘 Radicals content type

## Implementation Details

### ProgressionController/Service/Repository Pattern

Follow the exact FoundationProgress pattern from Epic 18:

```javascript
// ProgressionController.js — add methods:
async getRadicalProgress(req, res) { /* GET /api/v1/progression/radical-progress */ }
async getRadicalProgressById(req, res) { /* GET /api/v1/progression/radical-progress/:radicalId */ }
async updateRadicalProgress(req, res) { /* PUT /api/v1/progression/radical-progress/:radicalId */ }
```

### Side-Effect Implementation

```javascript
// ProgressionService.js — EXTEND constructor to accept reviewService
class ProgressionService {
  constructor(progressionRepository, reviewService) {
    this.progressionRepository = progressionRepository;
    this.reviewService = reviewService;
  }
  // ...

  async upsertRadicalProgress(userId, radicalId, data) {
    // 1. Update RadicalProgress table
    const progress = await this.repository.upsertRadicalProgress(userId, radicalId, data);

    // 2. Side-effect: if memorized=true, create/update ReviewItem
    if (data.memorized === true) {
      try {
        await this.reviewService.recordRating({
          itemType: "radical",
          itemId: radicalId,
          rating: "good",
          userId,
        });
      } catch (error) {
        // Fire-and-forget: RadicalProgress update succeeds even if review recording fails
        console.error("Failed to create ReviewItem side-effect:", error);
        // Background queue (event emitter or microtask) retries failed recordings
      }
    }

    return progress;
  }
}
```

**Note:** `container.js` registration must be updated from:
`new ProgressionService(progressionRepository)`
to:
`new ProgressionService(progressionRepository, reviewService)`

This follows the same DI pattern already used by QuizService, which receives `progressionService` in its constructor.

### buildRadicalItem() Function Pattern

```javascript
// ReviewService.js — matching buildToneItem()/buildPinyinItem() pattern
function buildRadicalItem(radical, srs, now, sevenDaysAgo, source) {
  const nextReview = srs?.nextReview ? new Date(srs.nextReview) : now;
  const lastReviewed = srs?.lastReviewed ? new Date(srs.lastReviewed) : null;

  if (source === "due" && nextReview > now) return null;
  if (source === "recent" && (!lastReviewed || lastReviewed < sevenDaysAgo)) return null;

  return {
    id: srs?.id || `radical-${radical.id}`,
    itemType: "radical",
    itemId: radical.id,
    front: radical.glyph,
    back: `${radical.name_pinyin} — ${radical.meaning}`,
    category: "radicals",
    character: radical.glyph,
    pinyinPlain: radical.name_pinyin.replace(
      /[āáǎàōóǒòēéěèīíǐìūúǔùǖǘǚǜ]/g,
      (m) =>
        ({
          ā: "a",
          á: "a",
          ǎ: "a",
          à: "a",
          ō: "o",
          ó: "o",
          ǒ: "o",
          ò: "o",
          ē: "e",
          é: "e",
          ě: "e",
          è: "e",
          ī: "i",
          í: "i",
          ǐ: "i",
          ì: "i",
          ū: "u",
          ú: "u",
          ǔ: "u",
          ù: "u",
          ǖ: "ü",
          ǘ: "ü",
          ǚ: "ü",
          ǜ: "ü",
        })[m] || m,
    ),
    meaning: radical.meaning,
    studyCount: srs?.studyCount || 0,
    correctCount: srs?.correctCount || 0,
    nextReview: nextReview.toISOString(),
    intervalDays: srs?.intervalDays || 1,
  };
}
```

**Note:** `ReviewService.getReviewItems()` must also be extended to include radical content. Currently the method creates items only for tones and pinyin. Add a radical loading branch:

```javascript
// In ReviewService.getReviewItems(), after the existing includeTones block:
const includeRadicals = !typePrefix || typePrefix === "radical";
if (includeRadicals) {
  const radicals = await readContentDir("radicals");
  for (const radical of radicals) {
    const key = `radical:${radical.id}`;
    const srs = srsByKey.get(key);
    const item = buildRadicalItem(radical, srs, now, sevenDaysAgo, source);
    if (item) items.push(item);
  }
}
```

The `buildRadicalItem()` function follows the same pattern as `buildToneItem()` and `buildPinyinItem()`, accepting the content object, SRS state, and source filter parameters.

Also in `getReviewItems()`, update the `srsByKey` srsItems array to include `"radical"` item type:

```javascript
const srsItems = await this.reviewRepository.findByUserAndTypes(userId, [
  "pinyin-syllable",
  "tone-syllable",
  "radical",
]);
```

### ReviewPicker CONTENT_TYPES Update

```typescript
// ReviewPicker.tsx — CONTENT_TYPES array:
const CONTENT_TYPES = [
  { type: "pinyin", label: "Pinyin", icon: "🔤", description: "Pinyin recognition and recall" },
  { type: "tones", label: "Tones", icon: "🎵", description: "Tone recognition and recall" },
  { type: "radical", label: "Radicals", icon: "📘", description: "Radical recognition and recall" },
  // ... NEW entry
];
```

## Architecture Integration

```
Frontend                                   Backend
────────                                   ───────
radicalsService.ts                         ProgressionController.js
  └── PUT /radical-progress/rad_0001         └── updateRadicalProgress()
       └── { memorized: true }                   └── ProgressionService.upsertRadicalProgress()
                                                     ├── ProgressionRepository.upsert()
                                                     └── ReviewService.recordRating() ← side-effect

ReviewPicker.tsx                              ReviewService.js
  └── [📘 Radicals] button                     └── buildRadicalItem() ← loads content/radicals/
       └── GET /review/items?type=radical
```

## Technical Challenges & Solutions

### Challenge: Dual-Tracking Sync — RadicalProgress Triggers ReviewItem

**Problem:** When a user marks a radical as "memorized" (via RadicalProgress), the system also needs to create/update a ReviewItem SRS record. These are separate tables with separate services. The PUT handler must call ReviewService without creating a circular dependency.

**Solution:** ProgressionService receives ReviewService via constructor injection (already registered in container.js). The ProgressionController's updateRadicalProgress handler calls ProgressionService.upsertRadicalProgress(), which updates RadicalProgress, then calls `this.reviewService.recordRating()` as a write-only side-effect. The side-effect is fire-and-forget — if review recording fails, the RadicalProgress update still succeeds. A background queue (event emitter or simple microtask) retries failed review recordings.
