---
purpose: "Backend API reference — 7 domains (auth, health, caching, TTS, AI feedback, errors, env)"
status: active
last-verified: 2026-08-22
type: guide
---

# Backend API Specification

**Last Updated:** August 22, 2026

API reference for the NestJS backend server, covering the following domains. Each domain has its own specification file.

> ⚠️ **Scope note:** This reference covers the 7 operational domains listed below (auth, health, caching, TTS, AI feedback, error format, environment). The modulith has **15 modules** (audio, auth, characters, chengyu, foundations, grammar, health, mnemonics, phonetic-clusters, progression, quiz, radicals, readers, review, words — pinyin lives under foundations). The **complete** machine-readable API surface — all 54 route paths across every module — is captured in the OpenAPI spec at [`src/shared/docs/openapi.yaml`](../../src/shared/docs/openapi.yaml). Module-specific endpoint details live there (plus the per-module epic/feature docs); the domain files here document the cross-cutting operational concerns.

## Domain Index

| Domain                | File                               | Endpoints                                 |
| --------------------- | ---------------------------------- | ----------------------------------------- |
| Authentication        | [`auth.md`](auth.md)               | Register, login, refresh, logout, profile |
| Health Check          | [`health.md`](health.md)           | Server health, cache metrics              |
| Caching Strategy      | [`caching.md`](caching.md)         | TTS and AI feedback caching details       |
| Text-to-Speech        | [`tts.md`](tts.md)                 | TTS audio generation and retrieval        |
| AI Feedback           | [`ai-feedback.md`](ai-feedback.md) | Quiz answer explanations                  |
| Error Format          | [`errors.md`](errors.md)           | Standardized error response schema        |
| Environment Variables | [`env.md`](env.md)                 | Required and optional configuration       |

## Common Patterns

- **Base URL**: All endpoints are relative to `http://localhost:3001/api` (dev) or `https://mandarin-vite-react-ts-production.up.railway.app/api` (production)
- **Auth**: Protected endpoints require `Authorization: Bearer <access_token>` header (optional-auth endpoints proceed as guests without one)
- **Rate Limiting**: Login: 5/min per IP; Quiz: 100/hour per user; AI Feedback: 10/min per user; Passage generation: 5/day per user
- **Error Format**: All errors follow the `{ code, message, requestId }` envelope
- **Caching**: TTS (24h TTL), AI Feedback (24h TTL)
