---
purpose: How optionalAuth resolves on the TTS & passage-audio surface — guard mechanism, DI, and the findings log
status: active
last-verified: 2026-09-05
type: guide
audience: backend
tags: auth, guards, optionalAuth, tts, readers, audio
---

# OptionalAuth resolution on the TTS & passage-audio surface

**Category:** Backend Development — NestJS auth guards
**Last Updated:** September 5, 2026

> **What this note is.** A durable implementation/trace note (written 2026-09-05 from an approved
> codebase investigation) recording _how_ the "optionalAuth" surface actually resolves on the two
> text-to-speech endpoints, and the findings the trace produced. It is a mechanism reference for
> backend engineers working on the auth guards or the audio surface, not a story postmortem.

## Surface at a glance

| Endpoint (global `/api` prefix)      | Method | `ROUTE_PATTERNS`                                             | Controller / handler                                                                                                                                          | Guard                                  |
| ------------------------------------ | ------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `/api/v1/tts`                        | POST   | `ttsAudio` = `/v1/tts`                                       | `modules/audio/nest/audio-nest.controller.ts` — `@Controller("v1/tts")` (:42), handler `getTtsAudio` (:60)                                                    | `@UseGuards(OptionalAuthGuard)` (:59)  |
| `/api/v1/readers/passages/:id/audio` | POST   | `readersPassageAudioById` = `/v1/readers/passages/:id/audio` | `modules/readers/nest/readers-nest.controller.ts` — `@Controller("v1/readers")` (:84), `@Post("passages/:id/audio")` (:191), handler `getPassageAudio` (:194) | `@UseGuards(OptionalAuthGuard)` (:193) |

The `/api` prefix is applied globally by `setGlobalPrefix("api")` (`nest/configure-app.ts:55`). The
legacy Express surface (`AudioController`, `audioRoutes.ts`, `authMiddleware.ts`) no longer exists in
`src/` — the backend is fully Nest; the audio HTTP surface lives under `modules/audio/nest/`.

## How "optionalAuth" is resolved

`optionalAuth` is **not** a standalone middleware/value anymore. It is realized solely as the Nest
guard class `OptionalAuthGuard`, applied per-route with `@UseGuards`, that **never rejects**.

### 1. The guard — `OptionalAuthGuard`

Definition: `nest/guards/optional-auth.guard.ts` — `export class OptionalAuthGuard implements
CanActivate` (:28), constructor-injects `JwtService` (:29).

`canActivate(context)` runtime flow:

1. `req = context.switchToHttp().getRequest<Request>()`
2. `token = resolveAccessToken(req)` — see step 3.
3. **No token** → `return true` (:35–37). `req.userId` / `req.user` stay undefined — the caller is a guest.
4. **Token present** → `try { decoded = this.jwtService.verifyAccessToken(token); attachAuthUser(req, decoded); } catch { /* continue WITHOUT user */ }` (:39–46).
5. **Always** `return true` (:48) — never throws, never returns `false`; there is no 401/403 path on this guard.

### 2. DI wiring

- `OptionalAuthGuard` is a **provider, not a global guard** — it lives in `GuardsModule`
  (`nest/guards/guards.module.ts`, `providers: [AuthGuard, OptionalAuthGuard, RequireAuthGuard]`).
  It is deliberately never registered as `APP_GUARD` (a global guard would break the public
  reference-module routes). `GuardsModule` re-exports `SharedModule` so consumers can resolve
  `JwtService`.
- Consumers import `GuardsModule` and apply the guard via `@UseGuards(...)`:
  - `AudioModule` → `imports: [SharedModule, GuardsModule]` (`modules/audio/nest/audio.module.ts:34`).
  - `ReadersModule` → `imports: [SharedModule, GuardsModule, AudioModule]` (`modules/readers/nest/readers.module.ts:34`).
  - `AppModule` → imports `GuardsModule` (`nest/app.module.ts:89`).

### 3. Per-request token resolution — `resolveAccessToken`

`nest/guards/auth-guard.shared.ts:74` resolves the token in this order:

1. **`Authorization: Bearer <token>` header** (primary) — `header.split(" ")[1]` (:75–81); a malformed
   header yields `undefined` → treated as missing.
2. **httpOnly `accessToken` cookie fallback** (secondary) — `req.cookies?.[ACCESS_TOKEN_COOKIE]`
   (:83–84), where `ACCESS_TOKEN_COOKIE = "accessToken"` (:39).

The cookie transport is effectively unreachable in production today — both the guard helper comment
(`auth-guard.shared.ts:30–38`) and the frontend indicate only the `refreshToken` httpOnly cookie is
ever set. The cookie branch is a forward-compatible fallback; the `refreshToken` cookie is
deliberately never read here (it carries the refresh secret, never an access token).

### 4. What "optional" means (semantics)

`canActivate` **never returns `false` / never throws** — it is always `true`. Optionality is expressed
purely in whether identity gets attached:

| Request state                                | Outcome                                                                            |
| -------------------------------------------- | ---------------------------------------------------------------------------------- |
| No token                                     | `return true`; `req.userId`/`req.user` undefined → guest                           |
| Valid token (signature + expiry + env claim) | `attachAuthUser(req, decoded)` → authenticated (`req.user` + `req.userId`)         |
| Invalid / expired / env-mismatched token     | `verifyAccessToken` throws → swallowed by `catch` → still `return true` as a guest |

This is the calibrated guest semantics: a guest is a request with no verifiable identity; a stale/bad
token must never be treated as a valid user **and** must never hard-fail a public read.

- **Env-claim enforcement** — `JwtService.verifyAccessToken` (`shared/infrastructure/security/JwtService.ts:118`)
  calls `assertEnvClaim` (:62–68), which rejects a token whose `env` claim does not match the current
  `APP_ENV` (default `"production"`). An env-mismatched token therefore throws inside the guard → the
  `catch` swallows it → the request proceeds as a guest (no 401).

### 5. Downstream: no identity branch

Neither endpoint branches on identity:

- TTS route — `void req.userId` (`audio-nest.controller.ts:75`) is **inert**: it reads the field to
  "surface" the guest-vs-user distinction but has no functional effect; the handler delegates straight
  to `AudioService.getTtsUrl(text, voice)`.
- Passage-audio route — the handler never reads `req.userId`; `readers-nest.controller.ts:205` passes
  only `id` to the service (`readersService.getPassageAudio(id)`).

Both guests and authenticated users traverse the **identical** service path
(`AudioService.getTtsUrl` / the passage-audio resolver) with no guest-vs-user branch.

### 6. The "free cache-first for guests" guarantee is GCS, not auth

The cache-first posture is **not** implemented in auth logic. `AudioService.getTtsUrl`
(`modules/audio/services/AudioService.ts:49`) validates input and delegates to the unified
exists-or-synthesize primitive; a GCS cache **hit** returns a signed URL with `{ cached: true }` and
triggers **no** billable Google TTS generation. The auth guard only decides whether identity is
attached — it plays no role in the free-for-guests guarantee.

### 7. Frontend corroboration

- The axios request interceptor adds `Authorization: Bearer <token>` **only when a token exists** in
  localStorage (`frontend/src/shared/api/axiosClient.ts:135` reads `accessToken`; :148 sets the
  header) — guests POST with no auth header.
- There is **no frontend guest short-circuit**: guests and users both POST to both endpoints. Pinned
  by tests: `features/quiz/components/__tests__/AudioPlayer.test.tsx` ("guests also POST /v1/tts
  (optionalAuth) — no guest short-circuit for words" / "users also POST … same behavior") and
  `pages/__tests__/ReadersPage.audio.test.tsx` (guest: `POST …/passages/:id/audio` IS fired once —
  no guest short-circuit).
- Docs are consistent with this: `apps/frontend/src/features/readers/docs/design.md:44–45` and the
  TTS audio pipeline guide describe the shared guests+users fetch path.

## Findings log

The trace produced six findings. They are grouped here by who can act on them: **docs-actionable**
(an edit to a doc file), **code-comment** (a comment/label inside a code file), and **live-gap**
(deferred code work / current-state posture).

| #   | Location (file:line)                                                                                                                                                                                                                      | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Category                                      |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| 1   | `docs/guides/integrations/tts-audio-pipeline.md:40` and `:94`                                                                                                                                                                             | **Stale file paths** — both reference the deleted Express surface: line 40 ("The HTTP mapping lives in `modules/audio/api/`") and line 94 ("`apps/backend/src/modules/audio/api/audioRoutes.ts` + `AudioController.ts` — `POST /v1/tts`"). `modules/audio/api/` does not exist; the live controller is `modules/audio/nest/audio-nest.controller.ts`.                                                                                                                      | **Stale-doc — actionable by docs**            |
| 2   | `modules/audio/nest/audio-nest.controller.ts:14–15`; `nest/guards/optional-auth.guard.ts:3–5`; `nest/guards/auth-guard.shared.ts` header (`:19–24`); `apps/backend/tests/integration/nest/audio-health-parity.test.ts` header (~`:19–26`) | **Historical "mirrors Express optionalAuth / authMiddleware / AudioController" comments.** Accurate provenance, but they reference deleted Express code; a reader hunting those files will not find them. Intentional provenance notes, not doc defects.                                                                                                                                                                                                                   | **Code-comment — flagged, not fixed by docs** |
| 3   | `modules/audio/nest/audio-nest.controller.ts:23–25` (docstring)                                                                                                                                                                           | **Deferred counter-gating (live gap).** Guest-visible TTS _generation_ (a guest cache MISS) is billable today — there is no counter or rate limit on `POST /v1/tts` (as of 2026-09-05). The docstring states the generated-audio path is counter-gated with the mechanics deferred; no counter ships on this route.                                                                                                                                                        | **Live-gap — flagged, not fixed**             |
| 4   | `modules/audio/nest/audio-nest.controller.ts:75`                                                                                                                                                                                          | **Inert `void req.userId`** on the TTS route — a placeholder that surfaces (but never branches on) identity; no functional effect. Identity is entirely unused on the passage-audio route (`readers-nest.controller.ts:205` passes only `id`).                                                                                                                                                                                                                             | **Code-level — flagged, not fixed**           |
| 5   | `apps/frontend/src/features/readers/stores/readingStore.ts:143`                                                                                                                                                                           | **Mislabeled comment.** Line 143 says a `completePassage` persist "would 401" under "optionalAuth" — but the endpoint it calls (`POST /v1/readers/sessions/:passageId/complete`, `RequireAuthGuard` at `readers-nest.controller.ts:378`) is a **`RequireAuthGuard`** route, not optionalAuth. Behavior (skip guest persist) is correct; the label is wrong. Requires a one-line code-file comment edit — out of docs scope.                                                | **Code-comment — flagged, not fixed by docs** |
| 6   | `docs/business/research/feature-inventory.md:37`                                                                                                                                                                                          | **Minor framing.** "…the **two TTS surfaces** (`POST /v1/tts` + passage-audio) which are `optionalAuth` today and are the **sole flip-candidates**; resolve in epic-25/29." Still consistent with current code (both surfaces remain `optionalAuth`; counter-gating is deferred) but the "resolve in epic-25/29" phrasing predates the completed calibration — only the counter-gating deferral (see #3) remains open. Ratified research doc → owner-approved change only. | **Docs-actionable (minor) / informational**   |

### Truth-check correction to the source trace

The source investigation attributed the flag #6 framing to **`docs/architecture.md:344`** as well.
Truth-check against the current file found **no such claim there**:

- `docs/architecture.md:344` is the `/v1/progression/gates` statement — "The route uses `optionalAuth`
  — **guest users receive an all-passed response**…" — which is accurate and unrelated to TTS.
- A repo-wide grep of `docs/architecture.md` for `flip-candidat|sole flip|epic-25|epic-29|counter-gat`
  returns nothing. `architecture.md` currently describes the audio surface at :75 (`modules/audio/nest/`
  mounts `POST /v1/tts`) and :224/:226 (the two HTTP seams + passage-audio wire contract) without any
  flip-candidate/epic framing.

So flag #6 reduces to `feature-inventory.md:37`; `architecture.md` needs **no** TTS framing fix.

## Truth-check record (verified 2026-09-05)

Verified against these code sources before writing:

- **Endpoints** — both paths + verbs copied verbatim from `ROUTE_PATTERNS` (`packages/shared-constants/src/index.js`): `ttsAudio = "/v1/tts"`, `readersPassageAudioById = (id) => \`/v1/readers/passages/${id}/audio\``. Present, so both are real.
- **File existence** — every file cited exists; `modules/audio/api/` does **not** exist (the stale-doc
  target of flag #1); `modules/audio/nest/` does.
- **Line anchors** — confirmed with line-numbered reads: `optional-auth.guard.ts` class :28, no-token
  `return true` :36, catch-swallow :39–46, final `return true` :48; `auth-guard.shared.ts`
  `ACCESS_TOKEN_COOKIE` :39, `resolveAccessToken` :74, `attachAuthUser` :92; `audio-nest.controller.ts`
  `@Controller("v1/tts")` :42, `@UseGuards` :59, `getTtsAudio` :60, `void req.userId` :75,
  counter-gating docstring :23–25; `readers-nest.controller.ts` `@Post("passages/:id/audio")` :191,
  `@UseGuards(OptionalAuthGuard)` :193, `getPassageAudio` :194, service call (id only) :205;
  `JwtService.verifyAccessToken` :118, `assertEnvClaim` :62–68; `configure-app.ts` global prefix :55;
  DI: `audio.module.ts:34`, `readers.module.ts:34`, `app.module.ts:89`, `guards.module.ts` providers.
- **Data-source / cost claim** — `AudioService.getTtsUrl` (GCS exists-or-synthesize) read directly;
  the "cache-first free for guests = GCS existence, not auth" claim is grounded in that code.
- **Doc claims** — `feature-inventory.md:37` and the readers `design.md:44–45` confirmed by
  line-numbered read; the `architecture.md:344` attribution was checked and corrected (see above).

## Information gaps (not resolved by this note)

- **Cookie transport** — the `accessToken` cookie fallback is unreachable in prod today (only
  `refreshToken` is ever set); whether the auth module intends to set it later is not traced here.
- **Counter-gating follow-up** — flag #3's deferral status (which release/story owns it) is not traced
  (the source investigation was read-only).
- **Express-surface doc sweep** — whether every remaining `epic-24-*` BR/implementation-doc mention of
  the deleted Express audio surface is clearly marked historical (vs. presented as live) is not fully
  verified.

## Related

- [Backend architecture patterns](backend-architecture.md) — modulith + Nest shell context.
- [Authentication & security](backend-authentication.md) — token + guard ecosystem.
- [TTS audio pipeline guide](../../guides/integrations/tts-audio-pipeline.md) — owner of flag #1
  (stale Express file paths); the mechanism described here is its auth-layer companion.
- Corroboration (inline): `apps/frontend/src/features/readers/docs/design.md` (shared guests+users
  audio fetch path); `apps/backend/tests/integration/nest/audio-health-parity.test.ts` (F5 parity
  harness asserting the never-401 guest contract).
