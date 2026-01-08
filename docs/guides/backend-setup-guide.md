# Backend Setup Guide

This guide provides step-by-step instructions for setting up the Express backend server with authentication and database integration.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or Supabase)
- Environment variables configured (see [Environment Setup Guide](./environment-setup-guide.md))

## Quick Start

```bash
# Install dependencies
npm install

# Setup database
npx prisma migrate dev

# Start development server
npm run start-backend
```

## Express Server Setup

Create `src/server.ts`:

```typescript
import express from "express";
import { corsMiddleware } from "./middleware/cors";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/auth";

const app = express();

// Middleware (order matters!)
app.use(express.json());
app.use(corsMiddleware);  // Apply CORS once, before routes

// Routes
app.use("/api/auth", authRoutes);

// Error handling (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## CORS Configuration

Create `src/middleware/cors.ts`:

```typescript
import cors from "cors";

export const corsMiddleware = cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Set-Cookie"],
  maxAge: 86400,
});
```

Add to `.env.local`:

```env
FRONTEND_URL=http://localhost:5173
```

**⚠️ Critical:** Apply CORS middleware **once only** at app level. Duplicate CORS instances will break cookie-based authentication.

**Learn more:** [CORS Deep Dive](../knowledge-base/backend-architecture.md#cors-cross-origin-resource-sharing-deep-dive) - Why credentials matter, origin validation, troubleshooting

## Error Handling

Create `src/middleware/errorHandler.ts`:

```typescript
import { Request, Response, NextFunction } from "express";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  console.error("Error:", err);

  if (err instanceof PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Resource already exists" });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Resource not found" });
    }
  }

  res.status(500).json({ error: "Internal server error" });
}
```

## Security Configuration

### Password Hashing

```typescript
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### JWT Configuration

```typescript
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export function generateAccessToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "15m" });
}

export function verifyToken(token: string): any {
  return jwt.verify(token, JWT_SECRET);
}
```

## Troubleshooting

**CORS errors persist:**
1. Verify CORS middleware is before routes
2. Check for duplicate CORS calls
3. Confirm `FRONTEND_URL` is set
4. Ensure `credentials: true` in both frontend and backend

**Authentication middleware not working:**
1. Check JWT_SECRET matches between sign/verify
2. Verify token extraction logic
3. Confirm Prisma client is initialized

**Database connection errors:**
See [Supabase Setup Guide](./supabase-setup-guide.md#troubleshooting)

## Reference

- **Source**: [Story 13.3: JWT Authentication System](../business-requirements/epic-13-production-backend-architecture/story-13-3-authentication.md)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

**Learn more:**
- [Backend Architecture Patterns](../knowledge-base/backend-architecture.md) - Layered architecture, CORS concepts
- [Authentication Concepts](../knowledge-base/backend-authentication.md) - OAuth, SSO, session strategies

---

**Last Updated:** January 9, 2026
