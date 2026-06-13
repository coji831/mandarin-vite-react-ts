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

**Errors:** `400 INVALID_EMAIL`, `400 WEAK_PASSWORD`, `409 EMAIL_EXISTS`, `500 REGISTRATION_ERROR`

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
  "user": { "id": "uuid-123", "email": "user@example.com", "displayName": "John Doe" },
  "accessToken": "eyJhbGc...xyz",
  "expiresIn": 900
}
```

**Set-Cookie Header:** `refreshToken=<token>; HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Path=/`

**Errors:** `400 MISSING_CREDENTIALS`, `401 INVALID_CREDENTIALS`, `429 TOO_MANY_REQUESTS`, `500 LOGIN_ERROR`

**Rate Limiting:** Maximum 5 login attempts per minute per IP address.

---

## POST /api/v1/auth/refresh

Exchange refresh token for new access token. Refresh token is read from httpOnly cookie.

**Response (200 OK):**

```json
{
  "accessToken": "eyJhbGc...xyz",
  "expiresIn": 900
}
```

**Set-Cookie Header:** `refreshToken=<new_token>; HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Path=/`

> Note: Refresh token rotation is implemented. Old refresh token is invalidated and new one is issued.

**Errors:** `401 MISSING_REFRESH_TOKEN`, `401 INVALID_REFRESH_TOKEN`, `500 REFRESH_ERROR`

---

## POST /api/v1/auth/logout

Invalidate refresh token and clear session. Reads refresh token from httpOnly cookie.

**Response (204 No Content).** `Set-Cookie` header clears the refresh token.

**Errors:** `401 UNAUTHORIZED`, `500 LOGOUT_ERROR`

---

## GET /api/v1/auth/me

Get currently authenticated user's profile.

**Auth:** Required (JWT Bearer token)

**Headers:** `Authorization: Bearer <access_token>`

**Response (200 OK):**

```json
{
  "id": "uuid-123",
  "email": "user@example.com",
  "displayName": "John Doe",
  "createdAt": "2026-01-10T08:00:00.000Z"
}
```

**Errors:** `401 UNAUTHORIZED`, `404 USER_NOT_FOUND`

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
- Secure flag enforced in production (HTTPS only)
- Rate limiting on login (5 attempts/minute/IP)
