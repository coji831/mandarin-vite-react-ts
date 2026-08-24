---
purpose: Authentication endpoints — register/login at /api/v1/auth
status: active
last-verified: 2026-08-24
type: guide
---

# Authentication Endpoints

All authentication endpoints are at `/api/v1/auth`.

## POST /api/v1/auth/register

Create a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "displayName": "John Doe"
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
  "success": true,
  "data": {
    "user": {
      "id": "uuid-123",
      "email": "user@example.com",
      "displayName": "John Doe",
      "createdAt": "2026-01-14T10:00:00.000Z"
    },
    "accessToken": "eyJhbGc...xyz"
  }
}
```

**Set-Cookie Header:**

```
refreshToken=<token>; HttpOnly; Secure; SameSite=None; Max-Age=604800; Path=/
```

> Cookie attributes are environment-dependent: `Secure` is set **only in production** (HTTPS); `SameSite` is `none` in production and `lax` in development.

**Errors:** `400 MISSING_FIELDS` (missing email/password), `409 USER_EXISTS`, `400 INVALID_PASSWORD` (weak password), `429` (rate limit), `500 REGISTRATION_FAILED`

---

## POST /api/v1/auth/login

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
  "success": true,
  "data": {
    "user": { "id": "uuid-123", "email": "user@example.com", "displayName": "John Doe" },
    "accessToken": "eyJhbGc...xyz"
  }
}
```

**Set-Cookie Header:** `refreshToken=<token>; HttpOnly; Secure; SameSite=None; Max-Age=604800; Path=/`

> Cookie attributes are environment-dependent: `Secure` is set **only in production** (HTTPS); `SameSite` is `none` in production and `lax` in development.

**Errors:** `400 MISSING_FIELDS` (missing email/password), `401 INVALID_CREDENTIALS`, `429` (rate limit), `500 LOGIN_FAILED`

**Rate Limiting:** Maximum 5 login attempts per minute per IP address (brute-force limiter mounted on `/api/v1/auth/login` + `/api/v1/auth/register`).

---

## POST /api/v1/auth/refresh

Exchange refresh token for new access token. Refresh token is read from httpOnly cookie.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...xyz"
  }
}
```

**Set-Cookie Header:** `refreshToken=<new_token>; HttpOnly; Secure; SameSite=None; Max-Age=604800; Path=/`

> Note: Refresh token rotation is implemented. Old refresh token is invalidated and a new one is issued.

**Errors:** `400 MISSING_TOKEN` (no refresh-token cookie), `401 INVALID_TOKEN` (invalid/expired refresh token), `500 REFRESH_FAILED`

---

## POST /api/v1/auth/logout

Invalidate refresh token and clear the session. Reads the refresh token from the httpOnly cookie. Returns **200 OK** (not 204) with a `{ success, message }` body.

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

The `Set-Cookie` header clears the refresh token cookie.

**Errors:** `400 MISSING_REFRESH_TOKEN` (no refresh-token cookie — the cookie is still cleared), `500 LOGOUT_FAILED` (cookie is still cleared)

---

## GET /api/v1/auth/me

Get currently authenticated user's profile.

**Auth:** Required (JWT Bearer token)

**Headers:** `Authorization: Bearer <access_token>`

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-123",
      "email": "user@example.com",
      "displayName": "John Doe",
      "createdAt": "2026-01-10T08:00:00.000Z"
    }
  }
}
```

**Errors:** `401` (missing/invalid JWT), `404 USER_NOT_FOUND`, `500 PROFILE_LOAD_FAILED`

---

## JWT Token Details

**Access Token:**

- **Type**: Bearer token (Authorization header)
- **Lifetime**: 15 minutes
- **Payload**: `{ userId, email, type: "access" }`

**Refresh Token:**

- **Type**: HttpOnly cookie (automatic browser handling)
- **Lifetime**: 7 days
- **Payload**: `{ userId, tokenId, type: "refresh" }`
- **Storage**: Database-backed (server-side revocable)
- **Rotation**: New token issued on every refresh request

**Security Features:**

- bcrypt password hashing (cost factor: 10)
- Refresh token rotation prevents replay attacks
- HttpOnly cookies prevent XSS attacks
- `Secure` cookie flag set **only in production** (HTTPS); `SameSite=none` in production, `lax` in development
- Rate limiting on login (5 attempts/minute/IP)
