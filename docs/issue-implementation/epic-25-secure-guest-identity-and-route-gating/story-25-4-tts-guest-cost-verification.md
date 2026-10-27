---
purpose: Both optionalAuth TTS surfaces are cache-first-free for guests; generated-audio quota machinery handed to epic-29
status: in-progress
last-verified: 2026-10-27
type: implementation
---

**Last Updated:** October 27, 2026

# Implementation 25-4: Guest Cost Surface — TTS Cache-First Verification

> **BR Reference:** `docs/business-requirements/epic-25-secure-guest-identity-and-route-gating/story-25-4-tts-guest-cost-verification.md`
> **Status:** In Progress
> **Last Update:** October 27, 2026
> **Key Commit:** pending

> **Full local artifact (gitignored):** `verification-artifacts/epic-25-tts-guest-cost-surface.md` — measured
> 2026-10-27 at `8f507c66`, including the verbatim runner output, the per-surface source walk, and the
> cost-control greps. `verification-artifacts/` is gitignored by design (`.gitignore:46`,
> `verification-artifacts/README.md`), so this document is the record that survives on `main`.

## Implementation Summary

Story 25-4 is an **evidence** story, not a mitigation story. Both anonymous audio surfaces
(`POST /v1/tts`, `POST /v1/readers/passages/:id/audio`) already short-circuit on a GCS cache hit and never
401 a guest; the audit found both contracts already proven by the 24-10 / 24-12 parity harnesses. What was
missing was (a) the **bad-token** variant of that free-read proof on each surface and (b) a written record
of the cost exposure that epic-29 sizes its counter against.

**No production code changed.** Two test-only edits (one assertion pair on an existing TTS test, one new
readers test), two suite header comments, and the two documents.

Measured starting state (branch `epic-25-guest-identity`, 25-3 at `8f507c66`):

- A guest cache hit costs one GCS `stat` plus one URL signature — no vendor call. Proven for `/v1/tts`
  by `audio-health-parity.test.ts:258` and for readers by `readers-parity.test.ts:414`.
- **No cost control exists on either surface**: no limiter on `/api/v1/tts` at all, and the readers
  limiter returns early for non-GET (`rate-limit.config.ts:251-255`) so the audio POST is un-limited.
  No counter, no `AICallLog` model, no circuit breaker anywhere in `src/` or `prisma/`.

## Technical Scope

Verify + pin the cache-first-free contract of the two `optionalAuth` audio surfaces, and record the
cost-control inventory.

**Files:**

- `apps/backend/tests/integration/nest/audio-health-parity.test.ts` — update: the invalid-token case now
  also asserts `synthesizeSpeech` / `uploadFile` were **not** called (bad token = guest = free read).
- `apps/backend/tests/integration/nest/readers-parity.test.ts` — **NEW test** in the passage-audio block:
  invalid token → 200, every sentence `source: "gcs"`, no synthesis; plus the header auth-mapping note.
- `docs/issue-implementation/epic-25-secure-guest-identity-and-route-gating/story-25-4-tts-guest-cost-verification.md`
  — **NEW**: this record.
- `verification-artifacts/epic-25-tts-guest-cost-surface.md` — **NEW**: full local artifact (gitignored).

## Implementation Details

### Summary table (routes are the `ROUTE_PATTERNS` form; the shell mounts them under `/api`)

| Surface                       | Verb + path                           | Guard                                  | Guest 401? | Cache lookup                                    | On hit                                                           | On miss                                                       | Billable?           | Limiter today                                                              |
| ----------------------------- | ------------------------------------- | -------------------------------------- | ---------- | ----------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------- | ------------------- | -------------------------------------------------------------------------- |
| TTS word/short-phrase audio   | `POST /v1/tts`                        | `OptionalAuthGuard` (`@HttpCode(200)`) | **Never**  | `AudioSynthesizer.ts:51` `gcs.fileExists(path)` | 200 `{ audioUrl, cached: true }`; re-sign only; **no synthesis** | 200 `{ audioUrl, cached: false }`; synthesize → upload → sign | **Yes on miss**     | **None** — `/api/v1/tts` has no limiter mount at all                       |
| Readers passage audio (batch) | `POST /v1/readers/passages/:id/audio` | `OptionalAuthGuard` (`@HttpCode(200)`) | **Never**  | same primitive, once per sentence               | `data.audioUrls[i] = { url, source: "gcs" }`; **no synthesis**   | `source: "ondemand"` (synthesized) / `source: "failed"`       | **Yes on miss**, ×N | **Read limiter only** — `rateLimitReadersByAuth` early-returns for non-GET |

### Surface 1 — `POST /v1/tts`

| Step               | Location                                                                                       | Behaviour                                                      |
| ------------------ | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Route constant     | `packages/shared-constants/src/index.js:9`                                                     | `ttsAudio: "/v1/tts"`                                          |
| Controller         | `apps/backend/src/modules/audio/nest/audio-nest.controller.ts:42`                              | `@Controller("v1/tts")`                                        |
| Verb/status/guard  | `…/audio-nest.controller.ts:57-59`                                                             | `@Post()` → `@HttpCode(200)` → `@UseGuards(OptionalAuthGuard)` |
| Identity read      | `…/audio-nest.controller.ts:75`                                                                | `void req.userId` — read, never branched on                    |
| Delegation         | `…/audio-nest.controller.ts:79`                                                                | `audioService.getTtsUrl(text, voice)` → `{ audioUrl, cached }` |
| Fail-fast validate | `modules/audio/services/AudioService.ts:50-66`                                                 | empty / >15 words / non-Hanzi → 400 before any I/O             |
| Path resolution    | `AudioService.ts:68-69` → `services/paths.ts:17-23`                                            | `sha256("{text}-{voice}")` → `tts/{hash}.mp3`                  |
| **Cache lookup**   | `modules/audio/services/AudioSynthesizer.ts:51`                                                | `if (await this.gcs.fileExists(path)) {`                       |
| **Cache HIT**      | `AudioSynthesizer.ts:52-54`                                                                    | `cacheHit` log → `getSignedUrl(…, 3600)` → `cached: true`      |
| **Signing**        | `AudioSynthesizer.ts:53`; TTL `modules/audio/config.ts:17`; `services/AudioUrlSigner.ts:15-19` | V4 signed URL, 3600 s — no vendor call                         |
| **Synthesis call** | `AudioSynthesizer.ts:62`                                                                       | `tts.synthesizeSpeech(...)` — **miss path only**               |
| Miss tail          | `AudioSynthesizer.ts:68,71,74,76`                                                              | upload → sign → soft Redis path cache → `cached: false`        |
| Single-flight      | `AudioSynthesizer.ts:43` → `AudioPathCache.ts:61`                                              | concurrent same-path calls share one upstream synthesize       |

Guest semantics: `OptionalAuthGuard` returns `true` for a missing token and swallows a bad/expired token
(`src/nest/guards/optional-auth.guard.ts:35-48`), so `req.userId` stays `undefined` and the route never
401s.

### Surface 2 — `POST /v1/readers/passages/:id/audio`

| Step                    | Location                                                          | Behaviour                                                                          |
| ----------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Route constant          | `packages/shared-constants/src/index.js:47`                       | `readersPassageAudioById: (id) => "/v1/readers/passages/${id}/audio"`              |
| Controller              | `modules/readers/nest/readers-nest.controller.ts:191-193`         | `@Post("passages/:id/audio")` → `@HttpCode(200)` → `@UseGuards(OptionalAuthGuard)` |
| Delegation              | `…/readers-nest.controller.ts:205`                                | `readersService.getPassageAudio(id)`; `req.userId` never consulted                 |
| Service                 | `modules/readers/services/ReadersService.ts:161-167`              | load passage (404 if absent) → `readersAudioService.getPassageAudio(passage)`      |
| Batch fan-out           | `modules/readers/services/ReadersAudioService.ts:80-81`           | `Promise.allSettled` over `processSentence(text, index, passageHash)`              |
| Path resolution         | `ReadersAudioService.ts:73` → `services/paths.ts:26-34`           | `passageHash = sha256(join('', sentences[].text))` → `tts/{passageHash}/{i}.mp3`   |
| **Per-sentence branch** | `ReadersAudioService.ts:103-119`                                  | `synthesizeToPath(...)` → `cached ? "gcs" : "ondemand"`; throw → `"failed"`        |
| **Cache lookup / HIT**  | `AudioSynthesizer.ts:51` → mapped at `ReadersAudioService.ts:115` | `{ url, source: "gcs" }` — signing only, no generation                             |
| **Synthesis call**      | `AudioSynthesizer.ts:62`                                          | one `synthesizeSpeech` per missed sentence                                         |
| Failure isolation       | `ReadersAudioService.ts:85-93`                                    | per-sentence throw → `{ url: "", source: "failed" }`, never a 5xx                  |

Guest and registered callers take an **identical** code path here — the handler never looks at the caller.

## Cost-control inventory (measured at `8f507c66`)

1. **The audio POST is deliberately un-limited.** `configure-app.ts:119-126` is the complete limiter mount
   list (`words`, `auth/register`, `auth/login`, `mnemonics`, `readers/passages`, `quiz/feedback`);
   `git grep -n 'tts' apps/backend/src/nest/configure-app.ts` → **no matches**. Stated in prose at
   `rate-limit.config.ts:238-241`, enforced by the early return at `:251-255`.
2. **The readers limiter is a read limiter, not a cost control.** `READERS_GET_LIMITER_CONFIG` (60/min
   user) / `READERS_GUEST_GET_LIMITER_CONFIG` (20/min IP) never run on the audio POST, and they count
   requests on the cheap GETs — bypassable by rotating IPs, blind to generated audio.
3. **No counter, no `AICallLog`, no circuit breaker.** Greps from `apps/backend`:

   | Grep                                                           | Result                                                                                                                                                       |
   | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
   | `git grep -n -iE "ttsCounter                                   | generatedAudio                                                                                                                                               | audioQuota                                                                                    | spendCap                                             | dailyLimit.*(tts | audio)" -- src prisma` | **0 matches** |
   | `git grep -n -E "\.incr\(                                      | incrby                                                                                                                                                       | INCR" -- src`                                                                                 | **0 matches** — no Redis counter is ever incremented |
   | `git grep -n -i "AICallLog" -- src prisma` (and `ai_call_log`) | **0 matches** — no model in `prisma/schema.prisma` either                                                                                                    |
   | `git grep -n -i "circuit" -- src prisma`                       | 5 matches, **all prose** ("short-circuits"): `AudioService.ts:89`, `GeminiService.ts:95`, `GeminiService.test.ts:7`, `optional-auth-coverage.test.ts:82,103` |
   | `git grep -n -iE "throttler                                    | @Throttle" -- src prisma`                                                                                                                                    | 1 match: `rate-limit.config.ts:7` — a comment recording that `@nestjs/throttler` was rejected |
   | `git ls-files src/modules/audio`                               | 15 files, **no cost-control file**                                                                                                                           |

   The only state a miss writes is the soft Redis path cache (`AudioSynthesizer.ts:74` →
   `AudioPathCache.setPath`) — a write-through hint, not a meter.

## Exposure statement

Worst case today is **one billable synthesis per unique cache path**, forever free afterwards (GCS object
existence is the cache source of truth, `AudioSynthesizer.ts:51`; the object is never evicted by the app):

- `/v1/tts`: one synthesis per distinct `(text, voice)` — `text` is **not** normalised before hashing, so
  whitespace variants are distinct paths; the boundary guard (non-empty, ≤15 words, must contain Hanzi)
  shrinks but does not bound the space.
- readers: one synthesis per distinct sentence **per distinct passage text** (`sha256(join(sentences))`);
  a single request fans out to `sentences.length` misses.

Single-flight (`AudioSynthesizer.ts:43`) prevents only _concurrent duplicate_ work for the same path; it
does not prevent distinct-path spend. An unauthenticated caller can therefore walk the text space at
whatever rate the network allows.

## Epic-29 handoff

The two anonymous surfaces can reach billable generation. **Epic-29 owns** (1) a server-side per-guest
generated-audio counter inside the L5 demo-quota spine (2 generated calls/day per guest, keyed by device
guest id, not IP alone), (2) one `AICallLog` row per generation, (3) participation in the global
guest-spend circuit breaker, (4) the quota-exhausted response contract — a **quota prompt, never a lock**
(BM-1 L5/L6). Cache hits stay unlimited and free for guests and outside the counter.

The invariant epic-29 must preserve: **cache hit = zero billable, zero counted.**

**No counter, quota or `AICallLog` write ships in Epic 25.**

## Architecture Integration

```
POST /v1/tts ──────────────┐
                           ├─→ OptionalAuthGuard (guest = undefined, never 401)
POST /v1/readers/passages/ │            ↓
     :id/audio ────────────┘   ReadersAudioService.processSentence (per sentence)
                                       ↓
                              AudioService.synthesizeToPath (facade + validation)
                                       ↓
                              AudioSynthesizer.synthesizeOnce ── gcs.fileExists ──HIT──→ sign → cached
                                       │                          └──MISS─→ GoogleTTS → GCS → sign → setPath
                                       └── single-flight via AudioPathCache.dedupe
```

## Technical Challenges & Solutions

None of note — no production behaviour was changed and both contracts already held. The only judgement call
was **where to add the bad-token proof**: the `/v1/tts` suite already had an
`invalid token — STILL 200 as guest` case, so one assertion pair was added there instead of a duplicate test;
the readers suite had no bad-token audio case at all, so a sibling test was added next to its guest cache-HIT
test (not a restructure of the block).

### Adjacent observations (reported, not changed)

- **`/v1/tts` validation messages do not follow `"Failed to {action} {resource}"`.** `AudioService.ts:51`
  (`"Text is required."`), `:56` (`"Please enter between 1 and 15 words."`) and `:63` (the Hanzi guard
  message) are the legacy Express strings, pinned byte-for-byte by `audio-health-parity.test.ts:303-328`.
  They are unreachable for a _cost_ concern but they are an audit-item-1 non-conformance; rewriting them is
  a cross-surface API-contract change, so it is reported here rather than made in a verification story.
- **`/api/v1/tts` has no limiter mount at all** (not even a read-style one) — unlike readers, which at least
  has a GET limiter in front of its passages. Recorded for epic-29's sizing; deliberately not changed here.

### Doc Truth-Check

- [x] Endpoints match `ROUTE_PATTERNS` in `packages/shared-constants/src/index.js` (`ttsAudio:9`, `readersPassageAudioById:47`)
- [x] Feature/module/component names verified against `apps/backend/src/modules/` (`audio`, `readers`)
- [x] Data source matches the backing service/repository code (GCS existence check + Redis path cache; no DB read on the audio path except the passage lookup)
- [x] All relative markdown links resolve
- [x] Last Updated / Last Update date is current (`October 27, 2026`)

## Testing Implementation

**Integration tier** — real test DB, mocked GCS / Google TTS / Gemini (hermetic: no vendor call). Both
suites **ran, none skipped** (`checkDatabase()` available, real users registered and cleaned up).

```bash
cd apps/backend
npx vitest run tests/integration/nest/audio-health-parity.test.ts tests/integration/nest/readers-parity.test.ts --config vitest.integration.config.ts
# → Test Files  2 passed (2)   Tests  40 passed (40)
npx vitest run tests/integration/nest/readers-parity.test.ts --config vitest.integration.config.ts --reporter=verbose   # name-level evidence
npx vitest run src/modules/audio/services/__tests__/AudioSynthesizer.test.ts src/modules/readers/services/__tests__/ReadersAudioService.test.ts --config vitest.config.ts
npm run typecheck --workspace=@mandarin/backend
```

| Scenario                                                            | Test (file:line)                                           | Assertions                                                                                                              |
| ------------------------------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `/v1/tts` guest (no token) cache hit → free                         | `audio-health-parity.test.ts:258` _(pre-existing)_         | 2xx (⇒ not 401); `{ audioUrl: String, cached: true }`; `synthesizeSpeech` **not called**; `fileExists` called           |
| `/v1/tts` guest (**invalid token**) cache hit → free                | `audio-health-parity.test.ts:289` _(strengthened in 25-4)_ | + `synthesizeSpeech` not called (`:299`), `uploadFile` not called (`:300`)                                              |
| readers audio guest (no token) cache hit → free                     | `readers-parity.test.ts:414` _(pre-existing)_              | 2xx; every sentence `source === "gcs"` (`:422`); `synthesizeSpeech` **not called** (`:425`)                             |
| readers audio guest (**invalid token**) cache hit → free            | `readers-parity.test.ts:429` _(NEW in 25-4)_               | 2xx; non-empty `audioUrls`; every `source === "gcs"` (`:442`); no `synthesizeSpeech` (`:444`), no `uploadFile` (`:445`) |
| `/v1/tts` guest cache **miss** → billable (measured, not gated)     | `audio-health-parity.test.ts:266` _(pre-existing)_         | `cached: false`; `synthesizeSpeech` once; `uploadFile` once                                                             |
| readers audio guest cache **miss** → billable (measured, not gated) | `readers-parity.test.ts:448` _(pre-existing)_              | every sentence `source === "ondemand"` (`:455`); `synthesizeSpeech` called                                              |
| Service tier: exists → `cached: true`, no synthesis                 | `AudioSynthesizer.test.ts:62-70` _(pre-existing)_          | `cached: true`, signed URL, `synthesizeSpeech`/`uploadFile` not called, Redis untouched                                 |
| Service tier: `cached: true` → `source: "gcs"` at the passage path  | `ReadersAudioService.test.ts:78-96` _(pre-existing)_       | exact `tts/{passageHash}/{i}.mp3` delegation + `source: "gcs"`                                                          |

## Out of Scope (attested)

- **No quota / counter / limiter / `AICallLog` / circuit breaker** added — epic-29 owns all of it.
- **No Prisma schema or migration touched.**
- **No production code changed**; no new dependency.
- Related, out of scope: `verification-artifacts/epic-25-route-gating-verification.md` still describes
  frontend constructs that do not exist (epic README finding 7 — 25-3's cleanup, not this story's).
