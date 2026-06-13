# Security Conventions

**Last Updated:** June 7, 2026
**Purpose:** Mandatory security standards for all backend and frontend code across the monorepo
**Audience:** All developers

> **When to read this:** Before writing any authentication, API, or database code. Review when handling user input, secrets, or security-sensitive features.

---

## Table of Contents

1. [Credential Management](#1-credential-management)
2. [No Unsafe Defaults](#2-no-unsafe-defaults)
3. [Startup Validation](#3-startup-validation)
4. [Input Validation](#4-input-validation)
5. [Rate Limiting](#5-rate-limiting)
6. [Security Headers](#6-security-headers)
7. [Audit Logging](#7-audit-logging)
8. [Security Logging Patterns](#8-security-logging-patterns)
9. [XSS & SQLi Prevention](#9-xss--sqli-prevention)

---

## 1. Credential Management

**Do NOT commit secrets to git:**

- No `.env.local` in version control
- No hardcoded API keys, passwords, secrets in code
- Add sensitive files to `.gitignore`

**Safe practices:**

- Use `.env.example` with placeholder values
- Document required env vars in [Environment Setup Guide](../getting-started/environment-setup.md)
- Store production secrets in Railway/Vercel dashboards
- Rotate secrets regularly

**Emergency response if secrets committed:**

1. Immediately rotate all exposed secrets
2. Revoke old keys (JWT, API keys, database passwords)
3. Deploy with new secrets
4. Document incident in security log

---

## 2. No Unsafe Defaults

**Forbidden patterns:**

```javascript
// NEVER use fallback secrets
const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret";
const API_KEY = process.env.API_KEY || "development_key";
```

**Required pattern:**

```javascript
// Fail fast if required env var missing
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}
```

**Why:** Default secrets:

- Can leak to production if env var missing
- Create security vulnerabilities (predictable secrets)
- Hide configuration errors

---

## 3. Startup Validation

**Validate all critical environment variables on app startup** (before listening):

```javascript
// apps/backend/src/config/index.js
export function validateConfig() {
  const required = ["JWT_SECRET", "JWT_REFRESH_SECRET", "DATABASE_URL", "FRONTEND_URL"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  // Validate format/type
  if (process.env.PORT && isNaN(parseInt(process.env.PORT))) {
    throw new Error("PORT must be a number");
  }
}

// apps/backend/src/index.js
validateConfig(); // Call BEFORE app.listen()
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

**What to validate:**

- Required variables exist
- Correct format (URLs, numbers, booleans)
- Valid values (e.g., `NODE_ENV` in `['development', 'production', 'test']`)

---

## 4. Input Validation

**Sanitize and validate ALL user input** (defense-in-depth):

```javascript
// Backend route handler
app.post("/api/v1/auth/register", async (req, res) => {
  const { email, password } = req.body;

  // 1. Validate presence
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  // 2. Validate format
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  // 3. Validate constraints
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  // 4. Sanitize (lowercase email, trim whitespace)
  const sanitizedEmail = email.toLowerCase().trim();

  // Proceed with registration
});
```

**Validation layers:**

- Format validation (email, URLs, dates)
- Type validation (string vs number)
- Constraint validation (min/max length, allowed values)
- Sanitization (trim, lowercase, escape HTML)

**Use validation libraries** (recommended):

- `joi` or `zod` for schema validation
- `validator` for format checking (email, URL, etc.)

---

## 5. Rate Limiting

**Prevent brute force attacks** with rate limiting:

```javascript
import rateLimit from "express-rate-limit";

// Login endpoint: 5 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 requests
  message: "Too many login attempts. Try again later.",
});

app.post("/api/v1/auth/login", loginLimiter, authController.login);

// Registration: 3 accounts per hour per IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: "Too many accounts created. Try again later.",
});

app.post("/api/v1/auth/register", registerLimiter, authController.register);
```

**Recommended limits:**

| Endpoint       | Limit         | Window     |
| -------------- | ------------- | ---------- |
| Login          | 5-10 attempts | 15 minutes |
| Registration   | 3-5 attempts  | 1 hour     |
| Password reset | 3 attempts    | 1 hour     |
| General API    | 100 requests  | 1 minute   |
| File uploads   | 10 requests   | 1 hour     |

---

## 6. Security Headers

**Add security headers** (use `helmet` middleware):

```javascript
import helmet from "helmet";

app.use(helmet()); // Applies multiple security headers

// Manual headers if needed
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  next();
});
```

---

## 7. Audit Logging

**Log security-relevant events:**

- Failed login attempts
- Password changes
- Account creation/deletion
- Permission changes
- API key usage

**Example:**

```javascript
logger.warn("Failed login attempt", {
  email: email.toLowerCase(),
  ip: req.ip,
  userAgent: req.headers["user-agent"],
  timestamp: new Date().toISOString(),
});
```

**Do NOT log:** Passwords, tokens, credit cards, PII

---

## 8. Security Logging Patterns

**Frontend logging:**

- Never log tokens, passwords, or user secrets to console
- Use structured logging with severity levels
- Sanitize error messages before logging
- Log API errors with status codes but not response bodies containing PII

**Backend logging:**

- Always include correlation IDs for request tracing
- Log authentication and authorization failures
- Log input validation failures with field names (not values)
- Use warn level for security events, info for operational events

---

## 9. XSS & SQLi Prevention

**Frontend:**

- Use React's built-in JSX escaping (automatic XSS protection)
- Never use `dangerouslySetInnerHTML` without sanitization
- Sanitize user-generated content with DOMPurify if rendering HTML
- Validate and encode URLs in `href` attributes

**Backend:**

- Use Prisma parameterized queries (prevents SQL injection)
- Never concatenate user input into raw SQL strings
- Validate and sanitize all input at the API boundary
- Set `Content-Type` headers explicitly to prevent MIME-type sniffing
