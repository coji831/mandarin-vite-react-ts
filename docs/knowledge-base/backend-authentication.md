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

### Key Lessons

- Short-lived access tokens (15min), long-lived refresh (7d)
- Never store passwords in plain text
- Use bcrypt rounds: 10 for dev, 12+ for production
- Rotate refresh tokens on use (optional but secure)
- Store JWT secrets in environment variables

### When to Use

User authentication, API access control, mobile apps

---

**Related Guides:**

- [Backend Architecture](./backend-architecture.md) — Auth middleware integration
- [Database & ORM](./backend-database.md) — User model design
