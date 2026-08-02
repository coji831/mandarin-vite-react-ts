# Implementation 21-3: Passage Generation Backend

> ✅ **Complete — All verification checks pass**

> **BR Reference:** `docs/business-requirements/epic-21-graded-readers/story-21-3-passage-generation.md`

## Technical Scope

Build the backend passage generation system: Gemini API integration, backend segmenter with caching, error-handling middleware, and rate limiting.

**Files:**

- `apps/backend/src/modules/readers/` — container.ts, api/ (ReadersController.ts, ReadersRoutes.ts), services/ReadersService.ts, repositories/ReadersRepository.ts, types/readers.ts, api/**tests**/ReadersController.test.ts
- `apps/backend/src/modules/readers/types/readers-errors.ts` — typed error classes for Gemini, Segmenter, and reader-specific failures
- `apps/backend/src/app/container.ts` — wire readersModule with dependencies (geminiService, segmenterService, progressionService)
- `apps/backend/src/app/routes.ts` — register readers middleware + routes
- `apps/backend/src/shared/services/GeminiService.ts` — add `generateRaw()` method
- `apps/backend/src/modules/readers/services/SegmenterService.ts` — new: backend segmenter with word index
- `packages/shared-constants/src/index.js` — add readers route patterns
- `packages/shared-constants/src/index.d.ts` — add type declarations
- `docs/guides/prompt-templates.md` — prompt templates for 5 topics

## Implementation Details

### API Endpoints

| Method | Endpoint                          | Auth     | Description                                     |
| ------ | --------------------------------- | -------- | ----------------------------------------------- |
| `GET`  | `/v1/readers/passages?hskLevel=N` | optionalAuth | List cached passages at level                   |
| `GET`  | `/v1/readers/passages/:id`        | optionalAuth | Full passage with segmented result + audio URLs |
| `POST` | `/v1/readers/generate`            | Required | Generate passage. Body: `{ topic }`. Auth-only  |

### SegmenterService

- Lazy-loads the word index from the **database** on first use via `SegmenterService.loadWordIndex()` (`prisma.word.findMany` + `prisma.character.findMany`) — not from `content/words/`
- Segmenter algorithm: longest-match against word index
- Caches segmented result keyed by passage content hash
- Computes HSK profile from passage words

### GeminiService Modification

- Add `generateRaw(prompt, options)` method (no truncation, `maxTokens` default 1024, 30s timeout)
- Returns structured JSON (sentences with pre-split words + pinyin)
- Does NOT apply the 500-char substring truncation
- Uses the existing `GeminiClient.generateText()` under the hood
- knownWords/targetNewWords derived server-side from CharacterProgress data — see SegmenterService for HSK level derivation

### Prompt Format

Gemini returns JSON:

```json
{ "sentences": [{ "index": 0, "text": "我今天去学校。" }] }
```

Backend parses, segments, caches. (Forward-looking: RAG readiness is deferred — `pgvector` + `ContentEmbedding` are provisioned for a future retrieval-augmented pipeline; see epic implementation README Architecture Decision 9.)

### Error Handling

- Typed error classes in `modules/readers/types/readers-errors.ts` for Gemini, Segmenter, and reader-specific failures
- Error-catching handled inline in ReadersService or via `shared/middleware/errorMiddleware.ts`
- TTS errors are out of scope for this module (separate TTS module)
- Consumers handle at their level
- User sees fallback UI per error type

### Rate Limiting

- **Daily cap**: `express-rate-limit` with `windowMs: 24*60*60*1000, max: 5, keyGenerator: (req) => req.userId` (follows mnemonics module pattern)
- **Total storage cap**: DB check before insert — `COUNT WHERE generatedById = req.userId`, reject if ≥ 5
- Guest: 0 (cannot generate)
- Seeded demo passages (`generatedById = null`) do not count toward user caps

## Architecture Integration

```
[Story 21.3: Passage Generation Backend]
├── Controllers → ReadersController (GET passages, GET passage, POST generate)
├── Services → ReadersService (orchestration), SegmenterService (word segmentation)
├── Errors → Typed error classes in modules/readers/types/readers-errors.ts
└── GeminiService → generateRaw(prompt) extension

Consumed by: Story 21.4 (Reading UI frontend)
```

## Technical Challenges & Solutions

```
Problem: GeminiService.MAX_OUTPUT_LENGTH = 500 is too short for passages.
Solution: Add generateRaw() method without truncation. Do not modify existing
         generateText() to avoid regression.

Problem: Chinese word tokenization errors from Gemini.
Solution: Gemini returns structured JSON with pre-split sentences. Server-side
         validation catches mismatches. Regenerate on failure.

## Status

✅ **Complete** — All verification checks pass (14 unit tests, type-check, lint).

**Delivered:** PassageGenerationService, SegmenterService, ReadersService,
ReadersController, rate limiting (5/day + 5 total caps), GeminiService.generateRaw(),
container wiring, typed error classes, 14 unit tests.

### Doc Truth-Check (Verify Against Code)
- [x] Endpoints documented exist verbatim in `ROUTE_PATTERNS` (`packages/shared-constants/src/index.js`)
- [x] Feature/module/component names match `src/features/` / `src/modules/` listings
- [x] Data-source claims (content JSON vs Postgres/API) verified in the backing service
- [x] Every internal link resolves to an existing file
- [x] Last Updated date is current
```
