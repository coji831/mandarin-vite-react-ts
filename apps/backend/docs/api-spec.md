# Backend API Specification

> **This monolithic file has been split into domain-specific files.**  
> See the [`api/`](api/) directory for individual endpoint specifications.

The API specification is now organized by domain:

| Domain                | File                                       | Description                               |
| --------------------- | ------------------------------------------ | ----------------------------------------- |
| Authentication        | [`api/auth.md`](api/auth.md)               | Register, login, refresh, logout, profile |
| Health Check          | [`api/health.md`](api/health.md)           | Server health, cache metrics              |
| Caching Strategy      | [`api/caching.md`](api/caching.md)         | TTS and AI feedback caching details       |
| Text-to-Speech        | [`api/tts.md`](api/tts.md)                 | TTS audio generation                      |
| AI Feedback           | [`api/ai-feedback.md`](api/ai-feedback.md) | Quiz answer explanations                  |
| Error Format          | [`api/errors.md`](api/errors.md)           | Standardized error response schema        |
| Environment Variables | [`api/env.md`](api/env.md)                 | Required and optional configuration       |

**Last Updated:** June 8, 2026

## Authentication

All authentication endpoints are at `/api/v1/auth`.

### POST /api/v1/auth/register

Create a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "displayName": "John Doe" // optional
}
```

**Password Requirements:**

- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number

**Response (201 Created):**

```json
{
  "user": {
    "id": "uuid-123",
    "email": "user@example.com",
    "displayName": "John Doe",
    "createdAt": "2026-01-14T10:00:00.000Z"
  },
  "accessToken": "eyJhbGc...xyz",
  "expiresIn": 900
}
```

**Set-Cookie Header:**

```
refreshToken=<token>; HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Path=/
```

**Errors:**

- `400 INVALID_EMAIL`: Email format is invalid
- `400 WEAK_PASSWORD`: Password does not meet requirements
- `409 EMAIL_EXISTS`: Email already registered
- `500 REGISTRATION_ERROR`: Server error during registration

---

### POST /api/v1/auth/login

Authenticate existing user and issue tokens.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**

```json
{
  "user": {
    "id": "uuid-123",
    "email": "user@example.com",
    "displayName": "John Doe"
  },
  "accessToken": "eyJhbGc...xyz",
  "expiresIn": 900
}
```

**Set-Cookie Header:**

```
refreshToken=<token>; HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Path=/
```

**Errors:**

- `400 MISSING_CREDENTIALS`: Email or password not provided
- `401 INVALID_CREDENTIALS`: Email or password incorrect
- `429 TOO_MANY_REQUESTS`: Rate limit exceeded (max 5 attempts per minute per IP)
- `500 LOGIN_ERROR`: Server error during login

**Rate Limiting:**

- Maximum 5 login attempts per minute per IP address
- Failed attempts are logged for security monitoring

---

### POST /api/v1/auth/refresh

Exchange refresh token for new access token.

**Request:**

No body required. Refresh token is read from httpOnly cookie.

**Cookie Header:**

```
refreshToken=<token>
```

**Response (200 OK):**

```json
{
  "accessToken": "eyJhbGc...xyz",
  "expiresIn": 900
}
```

**Set-Cookie Header:**

```
refreshToken=<new_token>; HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Path=/
```

> **Note:** Refresh token rotation is implemented. Old refresh token is invalidated and new one is issued.

**Errors:**

- `401 MISSING_REFRESH_TOKEN`: No refresh token cookie present
- `401 INVALID_REFRESH_TOKEN`: Refresh token expired or invalid
- `500 REFRESH_ERROR`: Server error during token refresh

---

### POST /api/v1/auth/logout

Invalidate refresh token and clear session.

**Request:**

No body required. Refresh token is read from httpOnly cookie.

**Cookie Header:**

```
refreshToken=<token>
```

**Response (204 No Content):**

No response body. `Set-Cookie` header clears the refresh token.

**Set-Cookie Header:**

```
refreshToken=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/
```

**Errors:**

- `401 UNAUTHORIZED`: Missing or invalid refresh token
- `500 LOGOUT_ERROR`: Server error during logout

---

### GET /api/v1/auth/me

Get currently authenticated user's profile.

**Auth:** Required (JWT Bearer token)

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "id": "uuid-123",
  "email": "user@example.com",
  "displayName": "John Doe",
  "createdAt": "2026-01-10T08:00:00.000Z"
}
```

**Errors:**

- `401 UNAUTHORIZED`: Missing, expired, or invalid access token
- `404 USER_NOT_FOUND`: User account no longer exists

---

### JWT Token Details

**Access Token:**

- **Type**: Bearer token (sent in Authorization header)
- **Lifetime**: 15 minutes
- **Payload**: `{ userId, email, type: "access" }`
- **Usage**: Include in Authorization header for all protected endpoints

**Refresh Token:**

- **Type**: HttpOnly cookie (automatic browser handling)
- **Lifetime**: 7 days
- **Payload**: `{ userId, tokenId, type: "refresh" }`
- **Storage**: Database-backed (can be revoked server-side)
- **Rotation**: New refresh token issued on every refresh request

**Security Features:**

- bcrypt password hashing (cost factor: 10)
- Refresh token rotation prevents replay attacks
- HttpOnly cookies prevent XSS attacks
- Secure flag enforced in production (HTTPS only)
- Rate limiting on login endpoint (5 attempts/minute/IP)

---

## Other Endpoints

See the [`api/`](api/) directory for complete specifications of remaining domains:

| Domain                | File                                       | Description                      |
| --------------------- | ------------------------------------------ | -------------------------------- |
| Health Check          | [`api/health.md`](api/health.md)           | Server health and cache metrics  |
| Caching Strategy      | [`api/caching.md`](api/caching.md)         | TTS/conversation caching details |
| Text-to-Speech        | [`api/tts.md`](api/tts.md)                 | TTS audio generation             |
| AI Feedback           | [`api/ai-feedback.md`](api/ai-feedback.md) | Quiz error explanations          |
| Error Format          | [`api/errors.md`](api/errors.md)           | Standard error response          |
| Environment Variables | [`api/env.md`](api/env.md)                 | Config reference                 |

- Cache shared across users (common errors benefit all learners)
- Cache hit rate logged every 50 requests
- Target: >60% hit rate after 1 week of usage

**Business Rules:**

1. **Input Sanitization:**
   - User answer and correct answer stripped of dangerous characters (`<>{}[]`)
   - Maximum 100 characters per field
   - Empty strings after sanitization rejected (400 error)

2. **Timeout Handling:**
   - Gemini API call has 3-second timeout
   - Timeout returns generic fallback message (non-blocking UX)
   - Fallback: "We couldn't generate detailed feedback right now. Review this word again to reinforce your memory. Pay attention to tones, character shapes, and meanings."

3. **AI Prompt Strategy:**
   - Prompts Gemini to classify error type AND provide explanation
   - Response expected in JSON format: `{"errorType": "...", "explanation": "..."}`
   - Fallback classification logic if JSON parsing fails
   - Beginner-friendly language (no linguistic jargon)

4. **Rate Limiting:**
   - 10 requests per minute per user IP
   - 429 error returned if limit exceeded
   - Prevents API abuse and cost overruns

5. **Cost Optimization:**
   - Redis caching reduces API calls by ~70-80%
   - Cache metrics logged for monitoring
   - Daily Gemini API quota monitoring (future: auto-disable if exceeded)

**Errors:**

- `400 BAD_REQUEST`: Missing required fields, invalid wordId, empty answers after sanitization
- `401 UNAUTHORIZED`: Missing or invalid JWT token
- `404 NOT_FOUND`: Word ID does not exist in database
- `429 TOO_MANY_REQUESTS`: Rate limit exceeded (10/minute)
- `503 SERVICE_UNAVAILABLE`: Gemini API credentials missing or invalid
- `500 INTERNAL_ERROR`: Unexpected server error

**Error Response Examples:**

```json
// Missing required fields
{
  "error": "Missing required fields: wordId, userAnswer, correctAnswer, questionType are all required"
}

// Invalid wordId
{
  "error": "Invalid wordId: must be a positive number"
}

// Word not found
{
  "error": "Word not found"
}

// Rate limit exceeded
{
  "error": "Too many feedback requests. Please wait a moment before requesting more explanations."
}

// Gemini API unavailable
{
  "error": "AI feedback service is temporarily unavailable"
}
```

**Example Request:**
