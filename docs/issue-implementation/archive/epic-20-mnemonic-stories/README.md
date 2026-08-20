# Epic 20: Mnemonic Stories — Implementation

**BR Reference:** `docs/business-requirements/archive/epic-20-mnemonic-stories/README.md`

**Status:** Completed

**Last Update:** July 22, 2026

## Story Status

| Story                                        | Status       |
| -------------------------------------------- | ------------ |
| **Story 20.3: Character Decomposition Data** | ✅ Completed |
| **Story 20.1: Mnemonic Generation Backend**  | ✅ Completed |
| **Story 20.2: Mnemonic Display UI**          | ✅ Completed |

---

## Architecture Decisions

| Decision                      | Choice                                                                                     | Rationale                                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| **AI integration**            | Gemini API via `CachedAIFeedbackService` (Epic 15 pattern)                                 | Proven pattern. Redis caching, rate limiting, error handling.                               |
| **Auto-save**                 | Story saves on generation — no explicit save action                                        | User can edit or regenerate later.                                                          |
| **Embedding**                 | No standalone page — embedded in CharacterDetailHub (📖 button in HubActions)              | Mnemonics are a feature of characters, not a standalone activity. Prevents mobile overflow. |
| **Storage**                   | Backend API: `POST /api/mnemonics`, `GET /api/mnemonics/:char`, `PUT /api/mnemonics/:char` | Per-character, per-user. `isEdited` flag for custom stories.                                |
| **Cache key**                 | `mnemonic:{character}` — shared across users (unless edited)                               | Same story for same char saves API calls.                                                   |
| **Cache lookup order**        | DB(user-edited) → Cache(AI-generated) → DB(AI-generated) → Generate                        | Prefer user edits; fall back to cached AI; generate only when nothing exists.               |
| **Cache stampede prevention** | Redis `SETNX` lock per glyph, 20s TTL                                                      | Prevents 10 concurrent AI calls for same character.                                         |
| **When NOT to show**          | Simple pictographs (山, 日, 人, 水, 火 etc.) — skip generation                             | Visual learning is more efficient. No story needed.                                         |
| **Timeout**                   | Backend 10s, client 15s                                                                    | 100-300 token generation takes longer than 3s.                                              |
| **Cache TTL**                 | 30 days for unedited AI stories; no expiry for user-edited                                 | Extended from 7 days to reduce regeneration of identical stories.                           |
| **Fallback**                  | Generic fallback story via `getFallbackMnemonic()`                                         | Same pattern as `AIFeedbackService` — prevents empty states.                                |

---

## Prisma Model

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

---

## API Endpoints

| Method   | Path                        | Auth     | Rate Limit | Description                           |
| -------- | --------------------------- | -------- | ---------- | ------------------------------------- |
| `GET`    | `/api/mnemonics/:character` | Required | 60/min     | Get existing mnemonic for a character |
| `POST`   | `/api/mnemonics/:character` | Required | 10/min     | Generate + auto-save mnemonic         |
| `PUT`    | `/api/mnemonics/:character` | Required | 30/min     | Edit a saved mnemonic                 |
| `DELETE` | `/api/mnemonics/:character` | Required | 30/min     | Reset to AI-generated version         |

Error responses follow `{ error, code, message }` format per backend-error-messages.instructions.md.

---

## Component Hierarchy

### CharacterHub (Modal)

```
CharacterHub.tsx
├── HubCharacterCard
├── HubInfoLine
├── HubRadicalSection        (existing)
├── HubMnemonicSection       ★ NEW
├── HubEtymology             (existing)
├── HubReadings              (existing)
├── HubCommonWords           (existing)
├── HubActions               ★ MODIFIED — add 📖 "View Story" button
└── ...
```

### RadicalDetailCard (Modal)

```
RadicalDetailCard.tsx
├── Hero section
├── Etymology + Variants
├── ExampleCharGrid          (unchanged — 🔊 and ↗ only)
└── Notes section
```

---

## HubMnemonicSection States

| #   | State          | Trigger                       | UX                                   |
| --- | -------------- | ----------------------------- | ------------------------------------ |
| 1   | **Loading**    | Initial fetch                 | Spinner + "Loading story…"           |
| 2   | **Cached**     | GET returns story immediately | Skip spinner — render instantly      |
| 3   | **Empty**      | No story exists               | "✨ Generate Story" button           |
| 4   | **Generating** | POST in flight                | Spinner + "Creating mnemonic…"       |
| 5   | **Display**    | Story loaded                  | Story text + ✏️ Edit + 🔄 Regenerate |
| 6   | **Editing**    | Clicked ✏️                    | Textarea + 💾 Save + ✖ Cancel        |
| 7   | **Error**      | API failure                   | Error message + 🔄 Retry             |
| 8   | **Timeout**    | 15s elapsed                   | "Generation timed out" + Retry       |
| 9   | **Pictograph** | Simple character              | Info Box — no button                 |

---

## Caching Strategy

**Lookup order:**

1. DB query for user-edited story `(characterGlyph, userId)` where `isEdited=true`
2. Redis cache key `mnemonic:{character}` (shared across users)
3. DB query for AI-generated story (any user, isEdited=false)
4. Generate via Gemini → store in DB + Redis

**Cache stampede prevention:** Redis `SETNX lock:mnemonic:{character}` with 20s TTL. If lock fails, wait and retry lookup.

**TTL:** 30 days for AI-generated, no expiry for user-edited.

---

## Rate Limiting

| Endpoint          | Limit      | Scope                                 |
| ----------------- | ---------- | ------------------------------------- |
| `POST` (generate) | 10 req/min | Per-user (key: userId or IP fallback) |
| `PUT` (edit)      | 30 req/min | Per-user                              |
| `GET` (fetch)     | 60 req/min | Per-user                              |

---

## Validation Rules

- **characterGlyph:** Single Chinese character (`/^\p{Script=Han}$/u`)
- **Story (PUT):** 1-5000 chars, non-empty, HTML tags stripped
- **Pictographs:** Server-side rejection (defense in depth)
- **Empty decomposition:** Returns 422

---

## Pictograph List

Hardcoded set: `山, 日, 人, 水, 火, 木, 田, 口, 目, 月, 雨, 石, 大, 小, 子, 女, 心, 手, 足, 耳`

Frontend: greyed-out 📖 with `aria-disabled="true"` + tooltip. Info Box in HubMnemonicSection.
Backend: POST returns 422 for these characters.

---

## Accessibility

| Element           | Requirement                                        |
| ----------------- | -------------------------------------------------- |
| 📖 button         | `aria-label="View mnemonic story for {character}"` |
| Loading spinner   | `role="status"` + `aria-live="polite"`             |
| Error message     | `role="alert"`                                     |
| Pictograph button | `aria-disabled="true"` + tooltip                   |
| Edit button       | `aria-label="Edit mnemonic story"`                 |
| Textarea          | `aria-label="Edit mnemonic story"`                 |

---

## Component Registry Changes

**New component:** `Textarea` — multiline text input for story editing.

- Props: `value`, `onChange`, `placeholder`, `maxLength`, `disabled`, `rows`, `aria-label`
- Files: `apps/frontend/src/shared/components/Textarea/`

---

## High-Level File Inventory

### Create

- `apps/backend/src/modules/mnemonics/` (full module: controller, service, repository, validator, routes, types)
- `apps/frontend/src/features/character-hub/components/HubMnemonicSection.tsx` + `.css`
- `apps/frontend/src/features/character-hub/services/mnemonicService.ts`
- `apps/frontend/src/shared/components/Textarea/`
- `scripts/import-decomposition.js`
- `public/data/radicals/decomposition.json`

### Modify

- `apps/backend/prisma/schema.prisma` — Add `MnemonicStory` model
- `apps/backend/src/app/container.ts` — Wire dependencies
- `apps/backend/src/app/routes.ts` — Mount routes
- `packages/shared-constants/src/index.js` — Add route patterns
- `apps/frontend/src/features/character-hub/components/CharacterHub.tsx` — Add HubMnemonicSection
- `apps/frontend/src/features/character-hub/components/HubActions.tsx` — Add 📖 button (no changes to ExampleCharCell or RadicalDetailCard)
- `apps/frontend/src/shared/components/index.tsx` — Export Textarea
- `.github/component-registry.json` — Add Textarea + HubMnemonicSection

---

## Story Sequence

```
Story 20.3 (Decomposition Data) ──► Story 20.1 (Backend API) ──► Story 20.2 (Frontend UI)
```

**Why 20.3 first:** Decomposition data is a prerequisite for both backend (radical lookup in prompt) and prompt quality. Without it, the AI prompt has no radical context.

**Why 20.1 before 20.2:** Frontend has no data to display without the API. API contract must be stable before building UI.

### Story Docs

- [Story 20.3: Character Decomposition Data](story-20-3-character-decomposition-data.md)
- [Story 20.1: Mnemonic Generation Backend](story-20-1-mnemonic-generation-backend.md)
- [Story 20.2: Mnemonic Display UI](story-20-2-mnemonic-display-ui.md)

---

## Risks

| Risk                                     | Mitigation                                                           |
| ---------------------------------------- | -------------------------------------------------------------------- |
| Gemini API latency (5-8s generation)     | 15s client timeout, loading spinner, aggressive caching (30-day TTL) |
| Cache stampede (10 concurrent requests)  | Redis SETNX lock per glyph; wait-and-retry pattern                   |
| Low-quality stories                      | Auto-regenerate on empty/bad response. User can edit or regenerate   |
| Make Me a Hanzi import format changes    | Pin git commit hash. Add validation to import script                 |
| Mobile overflow (3+ buttons at 320px)    | 📖 moved to HubActions (not ExampleCharCell)                         |
| Modal stacking (RadicalDetailCard + Hub) | Clicking 📖 closes RadicalDetailCard first via callback              |
| User edits lost on regenerate            | Confirmation dialog: "This will replace your story"                  |
| Story HTML injection                     | Server-side sanitization strips all HTML tags on PUT                 |
