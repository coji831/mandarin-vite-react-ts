# Backend API Specification

**Last Updated:** July 1, 2026

Complete API reference for the Express backend server. Each domain has its own specification file.

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

- **Base URL**: All endpoints are relative to `http://localhost:3001` (dev) or production URL
- **Auth**: Protected endpoints require `Authorization: Bearer <access_token>` header
- **Rate Limiting**: Login: 5/min per IP; Quiz: 100/hour per user; AI Feedback: 10/min per user
- **Error Format**: All errors follow `{ code, message, requestId, metadata? }` structure
- **Caching**: TTS (24h TTL), AI Feedback (24h TTL)
