# TTS Audio Pipeline Guide

**Last Updated:** 2026-08-03

**Purpose:** How spoken audio is delivered to the browser — the unified audio capability (`modules/audio` on the backend, `shared/audio` as the frontend transport) and how the readers feature resolves per-sentence audio as data.

**Target Audience:** Backend + frontend developers working on TTS delivery or the graded readers audio flow.

---

## Overview

Audio is delivered through a **unified exists-or-synthesize primitive** (`D4`) — the old two-tier (Redis-first) flow is collapsed:

```
POST /v1/tts                        → word audio      (optionalAuth, { text, voice? } → { audioUrl, cached })
POST /v1/readers/passages/:id/audio → passage audio   (optionalAuth, { audioUrls: { [i]: { url, source } } })
      │
      ▼
AudioService facade ──► AudioSynthesizer.synthesizeToPath(text, path)   (path-parameterized primitive)
      │                          │  AudioPathCache.dedupe (per-path single-flight)
      ▼                          ▼
GCS fileExists? ── hit ──► re-sign 1h URL                     → { audioUrl, cached: true }
      │ miss
      ▼
GoogleTTS synthesize → GCS upload → sign 1h URL → record path in Redis → { audioUrl, cached: false }
```

**GCS existence is the single source of truth.** Redis is a **write-only pre-gen path index**: at request time the only interaction is the best-effort `setPath` on fresh-create; `getPath` is never called in the request path (it exists for unit tests and the future pre-gen story). A Redis outage never fails a request. Because there is no Redis backfill on cold hit, **hot cache hit == cold cache hit** — both run `fileExists → getSignedUrl`. Every sentence resolves to a short-lived signed GCS URL plus a `source` field; a per-sentence failure is reported as `source: "failed"` (empty URL) — never a batch failure.

## Backend capability: `modules/audio` (HTTP-free)

`apps/backend/src/modules/audio/` is a self-contained capability module (renamed from the scaffolded `modules/tts` — capability modules are named after the capability, never the provider). The HTTP mapping lives in `modules/audio/api/` (mounts `POST /v1/tts`):

- **`AudioService`** (`services/AudioService.ts`) — facade implementing `AudioServiceLike`. `getTtsUrl(text, voice)` validates input (1–`maxWords` words) then delegates to `synthesizeToPath` on the default word path `tts/{hash}.mp3`. `synthesizeToPath(text, path, voice)` is the unified primitive modules consume (e.g. `ReadersAudioService`).
- **`AudioSynthesizer`** (`services/AudioSynthesizer.ts`) — the exists-or-synthesize primitive: GCS exists-check → hit: re-sign + `cached:true`; miss: GoogleTTS synthesize → GCS upload → sign → record path in Redis → `cached:false`. Wrapped in a per-path single-flight so N concurrent calls for the same path trigger exactly ONE upstream synthesize. It passes `{ voice, languageCode, audioEncoding }` **explicitly** from `modules/audio/config.ts` to the Tier-0 `GoogleTTSClient` — shared never imports a module.
- **`AudioPathCache`** (`services/AudioPathCache.ts`) — Redis path cache (`tts:path:{hash}`, **24h** TTL = 86400s) storing the GCS **file path** (never the URL), plus `dedupe` (stampede guard). Writes are best-effort — a Redis outage never fails an audio request. **Write-only at runtime**: `setPath` fires on fresh-create; `getPath` is unused in the request path (pre-gen/unit tests only).
- **`AudioUrlSigner`** (`services/AudioUrlSigner.ts`) — re-signs a fresh short-lived read URL for a GCS path.
- **`services/paths.ts` / `config.ts`** — path conventions (`defaultWordPath`, `passagePath`, `passageHashFor`, `pathHash`) and config (`TTS_STORAGE_PATH = "tts/{hash}.mp3"`, `TTS_SIGNED_URL_TTL_SECONDS = 3600`, `audioConfig`).

## Unified namespace: `tts/{passageHash}/{i}.mp3`

On-demand passage audio writes to `tts/{passageHash}/{i}.mp3` (`passageHash` = SHA256 of the concatenated sentence texts; `i` = sentence index) — **identical** to the paths a future batch pre-gen would write (`D4`). On-demand and pre-gen therefore share one namespace. Older on-demand objects lived under the word namespace (`tts/{hash}.mp3`) and are simply no longer referenced — a harmless cold cache, **no migration needed**.

## Why signed URLs (not public buckets)

`<audio>` / `Audio()` elements **cannot attach `Authorization` headers**. Signed URLs are self-authenticating — the auth lives in the query string — so a browser can play them without the bucket being publicly readable. This is why short TTLs (1h — `TTS_SIGNED_URL_TTL_SECONDS = 3600`) and re-signing on every read exist: exposure is minimal while playback happens immediately after the API call.

## `source` semantics

Each per-sentence result carries a `source`:

| `source`   | Meaning                                                   | URL            |
| ---------- | --------------------------------------------------------- | -------------- |
| `gcs`      | File already existed in GCS (`cached: true`)              | signed GCS URL |
| `ondemand` | Synthesized on demand, uploaded, signed (`cached: false`) | signed GCS URL |
| `failed`   | Synthesis threw for this sentence                         | `""` (empty)   |

Because `ReadersAudioService` uses `Promise.allSettled`, a single sentence failure **never** fails the whole batch — it is reported as `source: "failed"`.

## Frontend: `shared/audio` transport + `PassageAudioBehavior`

Playback is transport-only: the shared `AudioManager` (`shared/audio/`) plays `PlayableItem[]` and holds **no resolver concept** — fallback policy is expressed as data (an ordered `candidates` list per item). The readers feature owns its playback contract:

- `buildPassageAudioBehavior({ passageId, sentences })` (`features/readers/audio/PassageAudioBehavior.ts`) produces a `sequence` `AudioBehavior` with one `PlayableItem` per sentence.
- **Shared fetch path (guests + users):** the endpoint is `optionalAuth` — guests POST and get real signed URLs exactly like users (no guest short-circuit). `sources` is a lazy async producer that fetches the per-sentence audio map ONCE per passage (in-flight deduped) via `fetchPassageAudio` (`features/readers/services/passageService.ts`). A `source:"gcs"| "ondemand"` entry with a URL → candidates `[url, tts]` (URL plays; a URL that plays-but-errors falls back to browser TTS via the candidate loop); `source:"failed"`/missing/empty URL → candidates `[]` (silent skip — never a TTS loop). A fetch failure → every sentence `[]` (silent skip, never a spinner). GCS cold-cache is the cost protector.
- `useAudioManager({ behavior })` (`shared/hooks/useAudioManager.ts`) resolves `behavior.sources`, loads the items, and mirrors the snapshot into `shared/store/audioStore.ts`.

## Reader flow end-to-end

1. `buildPassageAudioBehavior` builds the readers-owned `AudioBehavior`; `useAudioManager({ behavior })` drives it.
2. Shared path (guests + users): the behavior lazily calls `fetchPassageAudio(passageId)` → `POST /v1/readers/passages/:id/audio` (`ROUTE_PATTERNS.readersPassageAudioById`, `optionalAuth`), returning `{ audioUrls: { [index]: { url, source } } }` — guests receive real signed URLs, identical to users.
3. `ReadersAudioService.getPassageAudio(passage)` resolves every sentence in parallel through `synthesizeToPath(text, tts/{passageHash}/{i}.mp3)` — exists → `source:"gcs"`; synthesize → `source:"ondemand"`; throw → `source:"failed"`.
4. The manager plays each item's candidates: `{kind:"url"}` via `AudioEngine`; a URL media error calls `behavior.onUrlFailed` (→ `"fallback"`) and the manager advances to the next candidate — browser **SpeechSynthesis** (`BrowserTTS`) for user sentences. `{kind:"tts"}` uses `BrowserTTS` directly; where TTS is unavailable (e.g. Android WebView) the manager emits `skipped` and continues — never a spinner.

## Key files

- `apps/backend/src/modules/audio/services/AudioService.ts` — facade: `getTtsUrl` + `synthesizeToPath`
- `apps/backend/src/modules/audio/services/AudioSynthesizer.ts` — `AudioSynthesizer` (exists-or-synthesize primitive)
- `apps/backend/src/modules/audio/services/AudioPathCache.ts` — `AudioPathCache` (Redis path cache + single-flight)
- `apps/backend/src/modules/audio/services/AudioUrlSigner.ts` — `AudioUrlSigner` (signed URLs)
- `apps/backend/src/modules/audio/services/paths.ts` — `defaultWordPath` / `passagePath` / `passageHashFor` / `pathHash`
- `apps/backend/src/modules/audio/config.ts` — `TTS_STORAGE_PATH = "tts/{hash}.mp3"`, `TTS_SIGNED_URL_TTL_SECONDS = 3600`, `audioConfig`
- `apps/backend/src/shared/infrastructure/external/GCSClient.ts` — `getSignedUrl`, `fileExists`, `uploadFile`
- `apps/backend/src/shared/infrastructure/external/GoogleTTSClient.ts` — Tier-0 raw TTS client (explicit options only, no capability config)
- `apps/backend/src/modules/readers/services/ReadersAudioService.ts` — per-passage resolution + `source` semantics
- `apps/backend/src/modules/audio/api/audioRoutes.ts` + `AudioController.ts` — `POST /v1/tts`
- `apps/frontend/src/features/readers/audio/PassageAudioBehavior.ts` — `buildPassageAudioBehavior`
- `apps/frontend/src/features/readers/services/passageService.ts` — `fetchPassageAudio`
- `apps/frontend/src/shared/hooks/useAudioManager.ts` — playback orchestration
- `apps/frontend/src/shared/store/audioStore.ts` — audio state snapshot
- `apps/frontend/src/shared/audio/` — transport (`AudioManager`, `AudioEngine`, `BrowserTTS`, contracts)

## See also

- [TTS Caching](../../../apps/backend/docs/api/caching.md) — low-level cache key/TTL reference
- [TTS Endpoints](../../../apps/backend/docs/api/tts.md) — `POST /v1/tts` endpoint reference
- [Google Cloud Integration](../../knowledge-base/infrastructure/integration-google-cloud.md) — GCS setup, credentials, roles
- [Environment Setup](../../guides/getting-started/environment-setup.md) — `GOOGLE_TTS_CREDENTIALS_RAW` / `GCS_CREDENTIALS_RAW`
