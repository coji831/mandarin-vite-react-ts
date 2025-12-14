# Implementation 13-3: JWT Authentication System

## Technical Scope

Implement JWT-based authentication with access + refresh tokens, password hashing, and auth middleware. Build registration, login, refresh, and logout endpoints. Integrate frontend login/register forms.

## Implementation Details

```typescript
// apps/backend/src/core/services/AuthService.ts
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../../infrastructure/database/client";

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET!;
  private readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
  private readonly ACCESS_TOKEN_EXPIRY = "15m";
  private readonly REFRESH_TOKEN_EXPIRY = "7d";

  async register(email: string, password: string, displayName?: string) {
    // Validate password strength
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
      throw new Error(
        "Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number"
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error("User already exists");
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, passwordHash, displayName },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id);

    return { user: this.sanitizeUser(user), tokens };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.deletedAt) {
      throw new Error("Invalid credentials");
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      throw new Error("Invalid credentials");
    }

    const tokens = await this.generateTokens(user.id);
    return { user: this.sanitizeUser(user), tokens };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = jwt.verify(refreshToken, this.JWT_REFRESH_SECRET) as { userId: string };

      // Verify refresh token exists in database
      const session = await prisma.session.findUnique({
        where: { refreshToken },
        include: { user: true },
      });

      if (!session || session.expiresAt < new Date()) {
        throw new Error("Invalid refresh token");
      }

      // Generate new tokens
      const tokens = await this.generateTokens(payload.userId);

      // Delete old session, create new one
      await prisma.session.delete({ where: { id: session.id } });

      return tokens;
    } catch (error) {
      throw new Error("Invalid refresh token");
    }
  }

  async logout(refreshToken: string) {
    await prisma.session.deleteMany({ where: { refreshToken } });
  }

  private async generateTokens(userId: string) {
    const accessToken = jwt.sign({ userId }, this.JWT_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
    });

    const refreshToken = jwt.sign({ userId }, this.JWT_REFRESH_SECRET, {
      expiresIn: this.REFRESH_TOKEN_EXPIRY,
    });

    // Store refresh token in database
    await prisma.session.create({
      data: {
        userId,
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: any) {
    const { passwordHash, deletedAt, ...sanitized } = user;
    return sanitized;
  }
}
```

```typescript
// apps/backend/src/api/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  userId?: string;
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized", code: "NO_TOKEN" });
  }

  const token = authHeader.substring(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    req.userId = payload.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token", code: "INVALID_TOKEN" });
  }
};
```

```typescript
// apps/frontend/src/features/auth/hooks/useAuth.ts
import { useState } from "react";
import { API_PATHS } from "@mandarin/shared-constants";

export const useAuth = () => {
  const [user, setUser] = useState(null);

  const login = async (email: string, password: string) => {
    const response = await fetch(API_PATHS.AUTH.LOGIN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) throw new Error("Login failed");

    const { user, tokens } = await response.json();
    localStorage.setItem("accessToken", tokens.accessToken);
    localStorage.setItem("refreshToken", tokens.refreshToken);
    setUser(user);
    return user;
  };

  const register = async (email: string, password: string, displayName?: string) => {
    const response = await fetch(API_PATHS.AUTH.REGISTER, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, displayName }),
    });

    if (!response.ok) throw new Error("Registration failed");

    const { user, tokens } = await response.json();
    localStorage.setItem("accessToken", tokens.accessToken);
    localStorage.setItem("refreshToken", tokens.refreshToken);
    setUser(user);
    return user;
  };

  return { user, login, register };
};
```

## Architecture Integration

```
Frontend Login/Register Forms
    ↓ POST /api/v1/auth/*
AuthController (API Layer)
    ↓ delegates to
AuthService (Business Logic)
    ↓ uses
UserRepository + SessionRepository
    ↓ persists to
PostgreSQL (via Prisma)
```

Auth middleware (`requireAuth`) intercepts all protected routes, validates JWT, and injects `userId` into request context.

## Technical Challenges & Solutions

```
Problem: Refresh token rotation (prevent token reuse attacks)
Solution: Delete old refresh token when generating new one:
- Client requests /auth/refresh with old token
- Server validates, generates new token pair
- Old refresh token deleted from database
- Client receives new tokens and replaces stored ones
```

```
Problem: Rate limiting login attempts (prevent brute force)
Solution: Use express-rate-limit middleware:
- Track attempts per IP address
- Max 5 attempts per minute per IP
- Return 429 Too Many Requests after limit
- Log excessive attempts for security monitoring
```

## Testing Implementation

**Unit Tests:**

- Password hashing and validation
- JWT token generation and verification
- Token expiry enforcement
- User sanitization (no password leaks)

**Integration Tests:**

- Full registration flow: register → receive tokens → verify user created
- Login flow: login → receive tokens → verify tokens valid
- Refresh flow: use refresh token → receive new access token
- Logout flow: logout → verify token invalidated
- Auth middleware: protected route rejects invalid/expired tokens
