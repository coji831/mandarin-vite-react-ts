# TTS Audio Pipeline Guide

**Last Updated:** 2026-08-02

**Purpose:** How spoken audio is delivered to the browser — the three-tier TTS pipeline (GCS pre-generated → on-demand TTS → browser SpeechSynthesis) and how the readers feature resolves per-sentence audio URLs.

**Target Audience:** Backend + frontend developers working on TTS delivery or the graded readers audio flow.

---

## Overview

Audio in the app is delivered through **three tiers**, in priority order:

```
POST /v1/readers/passages/:id/audio
      │
      ▼
ReadersAudioService.getPassageAudio()          (Promise.allSettled — per-sentence isolation)
      │
      ├─ Tier 1: GCS pre-generated  → signed URL     → source: "gcs"
      ├─ Tier 2: On-demand TTS      → signed URL     → source: "ondemand"
      │           (TtsService.getTtsUrl)
      └─ Tier 3: browser SpeechSynthesis (frontend fallback, source: "failed" / no URL)
```

Every sentence resolves to a **short-lived signed GCS URL** plus a `source` field.
Tier 3 is not an API tier — it is a frontend-only fallback in the audio player.

---

## Tier 1 — GCS pre-generated audio (fast path)

Passage audio can be pre-generated (seeded / generated in an earlier run) and
stored in GCS under a deterministic path:

```
tts/{passageHash}/{sentenceIndex}.mp3
```

- `passageHash` = SHA256 of the concatenated sentence texts (`ReadersAudioService.getPassageAudio`)
- On a GCS hit, `ReadersAudioService.processSentence` returns the signed URL with `source: "gcs"`.

## Tier 2 — On-demand TTS (`TtsService.getTtsUrl`)

On a GCS miss, the reader delegates to the shared `TtsService.getTtsUrl(text)` —
deliberately, so synthesis + GCS upload + Redis caching are **not** duplicated.

**Cache model (L1 Redis → L2 GCS):**

- L1 **Redis** stores the **GCS FILE PATH** under `tts:path:{hash}` (TTL 24h = 86400s) — **not** the URL.
- L2 **GCS** stores the MP3 persistently at `tts/{hash}.mp3`.
- Every read re-signs a **fresh** signed URL with `TTS_SIGNED_URL_TTL_SECONDS = 3600`.

> **Why cache the path, not the URL?** Signed URLs expire. Caching the URL in
> Redis would serve stale, expired URLs. Caching the file path lets each read
> verify the GCS file still exists and re-sign a fresh URL (stale path entries
> are invalidated and regenerated).

Flow per request: Redis lookup (path, ~2ms) → verify GCS file exists → re-sign
fresh URL → return. If the path is stale, invalidate Redis and fall through to
synthesize → upload → cache path → sign.

## Why signed URLs (not public buckets)

`<audio>` / `Audio()` elements **cannot attach `Authorization` headers**. Signed
URLs are self-authenticating — the auth lives in the query string — so a browser
can play them without the bucket being publicly readable. This is why `source`
semantics and short TTLs (1h) exist: exposure is minimal while playback happens
immediately after the API call.

## Tier 3 — Browser SpeechSynthesis (frontend fallback)

If the audio URLs are unavailable or a URL fails to play (e.g. `401` for guests,
or an on-demand URL that failed), the frontend falls back to the browser's
`speechSynthesis` API in `useAudioPlayer` (Tier-3 fallback). Audio is delivered
either way, so this degrades gracefully without an error-level log.

## `source` semantics

Each per-sentence result carries a `source`:

| `source`   | Meaning                                              | URL            |
| ---------- | ---------------------------------------------------- | -------------- |
| `gcs`      | Tier 1 hit — pre-generated file found and signed     | signed GCS URL |
| `ondemand` | Tier 2 hit — synthesized on demand, uploaded, signed | signed GCS URL |
| `failed`   | Tier 1 + Tier 2 both failed for this sentence        | `""` (empty)   |

Because `ReadersAudioService` uses `Promise.allSettled`, a single sentence
failure **never** fails the whole batch — it is reported as `source: "failed"`.

## Reader flow end-to-end

1. Frontend `fetchPassageAudio(passageId)` → `POST /v1/readers/passages/:id/audio`
   (`ROUTE_PATTERNS.readersPassageAudioById`).
2. `ReadersAudioService.getPassageAudio(passage)` resolves every sentence in
   parallel (Tier 1 → Tier 2), returning `{ audioUrls: { [index]: { url, source } } }`.
3. `usePassageAudio` writes the map into `audioStore` (`loadAudioUrls`) for
   downstream consumers.
4. `useAudioPlayer` plays each sentence URL; on failure falls back to Tier 3
   browser SpeechSynthesis.

## Key files

- `apps/backend/src/shared/services/TtsService.ts` — two-tier cache orchestration, `getTtsUrl`
- `apps/backend/src/shared/infrastructure/external/GCSClient.ts` — `getSignedUrl`, `fileExists`, `uploadFile`
- `apps/backend/src/modules/readers/services/ReadersAudioService.ts` — per-passage resolution + `source` semantics
- `apps/backend/src/shared/config/tts.ts` — `TTS_STORAGE_PATH = "tts/{hash}.mp3"`, `TTS_SIGNED_URL_TTL_SECONDS = 3600`
- `apps/frontend/src/features/readers/services/passageService.ts` — `fetchPassageAudio`
- `apps/frontend/src/features/readers/hooks/usePassageAudio.ts` — loads URLs into `audioStore`
- `apps/frontend/src/features/readers/hooks/useAudioPlayer.ts` — playback + Tier-3 SpeechSynthesis fallback
- `apps/frontend/src/features/readers/stores/audioStore.ts` — audio state

## See also

- [TTS Caching](../../../apps/backend/docs/api/caching.md) — low-level cache key/TTL reference
- [TTS Endpoints](../../../apps/backend/docs/api/tts.md) — `POST /v1/tts` endpoint reference
- [Google Cloud Integration](../../knowledge-base/infrastructure/integration-google-cloud.md) — GCS setup, credentials, roles
- [Environment Setup](../../guides/getting-started/environment-setup.md) — `GOOGLE_TTS_CREDENTIALS_RAW` / `GCS_CREDENTIALS_RAW`
