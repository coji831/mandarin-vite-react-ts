# Implementation 20-1: Mnemonic Generation Backend

**Last Updated:** July 21, 2026

## Implementation Status

- **Status**: Completed
- **PR**: epic-20-mnemonic-stories

## Technical Scope

Implement the `modules/mnemonics/` backend module with full CRUD API for mnemonic stories, Gemini AI integration (reusing the `CachedAIFeedbackService` pattern from Epic 15), Redis caching with stampede prevention, rate limiting, input validation, and pictograph rejection.

**Files to create:**

- `apps/backend/src/modules/mnemonics/api/MnemonicsController.ts` — request handling, validation, response formatting
- `apps/backend/src/modules/mnemonics/api/mnemonicsRoutes.ts` — route definitions with rate limiting middleware
- `apps/backend/src/modules/mnemonics/services/MnemonicsService.ts` — business logic: 4-step lookup chain, Gemini generation, caching coordination
- `apps/backend/src/modules/mnemonics/repositories/MnemonicsRepository.ts` — Prisma queries (find, upsert, delete)
- `apps/backend/src/modules/mnemonics/types/mnemonics.ts` — TypeScript types (MnemonicResponse, CreateMnemonicDto, etc.)
- `apps/backend/src/modules/mnemonics/index.ts` — barrel exports

**Files to modify:**

- `apps/backend/prisma/schema.prisma` — Add `MnemonicStory` model
- `apps/backend/src/app/container.ts` — Wire MnemonicsController and MnemonicsService dependencies
- `apps/backend/src/app/routes.ts` — Mount `mnemonicsRoutes`
- `packages/shared-constants/src/index.js` — Add route patterns (`/api/mnemonics/:character`)

## Implementation Details

### Prisma Model

```prisma
model MnemonicStory {
  id              String   @id @default(uuid())
  characterGlyph  String
  userId          String?  // nullable — anonymous users get shared AI stories
  story           String
  radicalIds      Json     @default("[]")
  isEdited        Boolean  @default(false)
  isPictograph    Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([characterGlyph, userId])
  @@index([characterGlyph])
  @@index([userId])
}
```

### Cache Lookup Chain (4 Steps)

```typescript
// MnemonicsService.getMnemonic():
// Step 1: DB — user-edited story (characterGlyph, userId) where isEdited=true
// Step 2: Redis — cache key "mnemonic:{character}" (shared across users)
// Step 3: DB — any AI-generated story (characterGlyph, isEdited=false)
// Step 4: Generate via Gemini → store in DB + Redis cache

async function getMnemonic(character: string, userId?: string): Promise<MnemonicResponse> {
  // Step 1: Prefer user edits
  if (userId) {
    const userEdit = await this.repository.findByCharacterAndUser(character, userId, true);
    if (userEdit) return this.toResponse(userEdit);
  }

  // Step 2: Check shared Redis cache
  const cached = await this.cacheService.get(`mnemonic:${character}`);
  if (cached) return JSON.parse(cached);

  // Step 3: Check AI-generated stories in DB
  const aiStory = await this.repository.findAnyByCharacter(character, false);
  if (aiStory) {
    await this.cacheService.set(`mnemonic:${character}`, JSON.stringify(aiStory), 30 * 24 * 3600);
    return this.toResponse(aiStory);
  }

  // Step 4: Generate (with stampede prevention)
  return this.generateWithStampedeProtection(character, userId);
}
```

### Cache Stampede Prevention (SETNX)

```typescript
async function generateWithStampedeProtection(character: string, userId?: string) {
  const lockKey = `lock:mnemonic:${character}`;
  const acquired = await this.cacheService.setNX(lockKey, "1", 20); // 20s TTL

  if (!acquired) {
    await new Promise((r) => setTimeout(r, 500));
    return this.getMnemonic(character, userId); // retry from Step 1
  }

  try {
    const story = await this.generateFromGemini(character);
    const saved = await this.repository.upsert(character, userId, story);
    await this.cacheService.set(`mnemonic:${character}`, JSON.stringify(saved), 30 * 24 * 3600);
    return this.toResponse(saved);
  } finally {
    await this.cacheService.del(lockKey);
  }
}
```

### Controller Validation & Error Format

```typescript
const PICTOGRAPHS = new Set(["山", "日", "人", "水", "火", "木", "田", "口", "目", "月", "雨", "石", "大", "小", "子", "女", "心", "手", "足", "耳"]);

async generate(req: Request, res: Response) {
  const { character } = req.params;

  if (!/^\p{Script=Han}$/u.test(character)) {
    return res.status(400).json({
      error: "Failed to generate mnemonic story",
      code: "VALIDATION_ERROR",
      message: "character must be a single Chinese character",
    });
  }

  if (PICTOGRAPHS.has(character)) {
    return res.status(422).json({
      error: "Failed to generate mnemonic story",
      code: "VALIDATION_ERROR",
      message: "Pictograph characters do not support mnemonic generation",
    });
  }
  // ... proceed with generation
}
```

## Architecture Integration

```
MnemonicsModule
  ├── MnemonicsRoutes (rate-limited GET/POST/PUT/DELETE)
  │     └── MnemonicsController (validation, error formatting)
  │           └── MnemonicsService (lookup chain, stampede prevention)
  │                 ├── MnemonicsRepository (Prisma)
  │                 ├── CachedAIFeedbackService (Gemini — Epic 15 pattern)
  │                 └── CacheService (Redis — 30-day TTL, SETNX locks)
  │
  └── Dependencies wired in container.ts
        └── Routes mounted in app/routes.ts
```

## Technical Challenges & Solutions

### Challenge: Cache Stampede with Concurrent Requests

**Problem:** Ten learners clicking "Generate" on the same character simultaneously would trigger 10 identical Gemini API calls.

**Solution:** Redis `SETNX` lock per glyph with 20s TTL. The first request acquires the lock and generates. Subsequent requests fail to acquire the lock, wait 500ms, and retry the full lookup chain.

### Challenge: Lookup Order Complexity

**Problem:** Three storage layers (DB user-edited, DB AI-generated, Redis cache) with different scoping rules create a complex retrieval path.

**Solution:** Encode the lookup chain as a sequential 4-step fallthrough. Each step either returns a result or falls through to the next.

### Challenge: Pictograph Server-Side Rejection

**Problem:** Simple pictographs don't benefit from mnemonic stories, but frontend could be bypassed.

**Solution:** Hardcode the pictograph set server-side as defense-in-depth. POST returns 422 before any generation logic runs.

## Testing Implementation

- **Unit tests**: MnemonicsService — test 4-step lookup chain, stampede prevention, pictograph rejection, input validation
- **Unit tests**: MnemonicsRepository — test Prisma queries with in-memory DB
- **Integration tests**: API endpoints — test GET/POST/PUT/DELETE with auth, rate limiting, validation errors
- **Integration tests**: Cache behavior — verify cached stories return without regeneration
- **Integration tests**: Stampede — fire 5 concurrent POST requests, verify only 1 Gemini call

## Completed Work

- Created `apps/backend/src/modules/mnemonics/` — full module with controller, service, repository, routes, types
- Added `MnemonicStory` Prisma model with `@@unique([characterGlyph, userId])`
- 4 CRUD endpoints: GET, POST, PUT, DELETE with rate limiting
- 4-step cache lookup chain (DB user-edited → Redis cache → DB AI → generate)
- Cache stampede prevention via `SETNX` lock
- Input validation: Han char regex, story length, pictograph rejection
- Error responses in `{ error, code, message }` format
- All fixed audit issues: isEdited logic, null userId, per-user rate limiting, HTML sanitization
