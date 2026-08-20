# Story 19.3: Backend RadicalProgress + SRS Review Integration

## Description

**As a** learner,
**I want to** the app to track which radicals I've memorized, and have memorized radicals automatically added to my daily SRS review queue,
**So that** both my progress and my long-term retention are managed.

## Business Value

RadicalProgress is the backend foundation for the entire radicals feature. Without progress tracking, learners cannot see which radicals they've mastered, the Radical Trees feature has no data to display, and radicals cannot be scheduled for SRS review. This story delivers the API layer that powers all radical progress features across the epic. Integrating radicals into the SRS review system ensures long-term retention using the same proven active-recall pattern already established for pinyin and tones.

## Acceptance Criteria

- [ ] RadicalProgress Prisma model added with fields: id, userId, radicalId, memorized, recognitionLevel, reviewedAt, createdAt (verify: model in schema.prisma)
- [ ] `@@unique([userId, radicalId])` constraint prevents duplicate progress records (verify: constraint defined)
- [ ] `@@index([userId])` for efficient user-scoped queries (verify: index defined)
- [ ] GET /api/v1/progression/radical-progress returns user's radical progress (verify: endpoint returns array)
- [ ] GET /api/v1/progression/radical-progress/:radicalId returns progress for specific radical (verify: returns single record or 404)
- [ ] PUT /api/v1/progression/radical-progress/:radicalId creates or updates progress (verify: POST → record created, PUT → record updated)
- [ ] Validates radicalId against content data (verify: unknown radicalId returns 400)
- [ ] All endpoints require authenticateToken middleware (verify: unauthenticated request returns 401)
- [ ] PUT /api/v1/progression/radical-progress/:radicalId creates a ReviewItem side-effect when memorized=true (verify: memorized radical appears in ReviewItem SRS table)
- [ ] "radical" added to ReviewItemType union in review/types (verify: type definition includes "radical")
- [ ] buildRadicalItem() function in ReviewService loads radical data from content/radicals/\*.json (verify: function returns correctly shaped review item)
- [ ] ReviewPicker shows [📘 Radicals] content type button alongside existing [🔤 Pinyin] and [🎵 Tones] (verify: picker renders 3 content types)
- [ ] Radical review card shows radical glyph → user types pinyin → selects tone → rates A/G/E (verify: three-step flow works for radical items)
- [ ] Radical review items respect due/recent/all source filters (verify: source filtering works the same as pinyin/tones)

## Business Rules

1. RadicalProgress.upsert(memorized=true) triggers ReviewItem side-effect: ReviewService.recordRating({ itemType: "radical", itemId, rating: "good" })
2. "radical" added to ReviewItemType union in shared types
3. buildRadicalItem() follows the same pattern as buildToneItem()/buildPinyinItem() — loads radical data from readContentDir("radicals")
4. ReviewPicker gets { type: "radical", label: "Radicals", icon: "📘" } — no new review components needed

## Related Issues

- Epic 19 / **Radicals & Character Composition** ([README.md](README.md)) (Parent epic)
- Story 19.4 / **Radical Trees (Phase 3)** ([story-19-4-radical-trees.md](story-19-4-radical-trees.md)) (Depended on by — trees need progress data)
- Story 19.5 / **Character Hub Radical Section** ([story-19-5-character-hub-radical-section.md](story-19-5-character-hub-radical-section.md)) (Depended on by — hub section may show progress)

## Implementation Status

- **Status**: Completed
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: `e40ca8c`
