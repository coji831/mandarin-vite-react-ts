# PostgreSQL Setup & Migrations

**When Adopted:** Epic 13

## Why

Production-grade, scalable, and reliable relational database for multi-user backend.

## Use Case

- Persistent user data
- Cross-device sync
- Advanced queries

## Steps

1. **Install PostgreSQL** (local or cloud)
2. **Set DATABASE_URL** in `.env`
3. **Edit `prisma/schema.prisma`** for your models
4. **Run migrations:**
   ```sh
   npx prisma migrate dev --name init
   # For production:
   npx prisma migrate deploy
   ```
5. **Use Prisma Client** in your code

## Minimal Example

```prisma
// schema.prisma
model User {
  id    Int    @id @default(autoincrement())
  email String @unique
}
```

## Key Lessons

- Always use migrations, not manual SQL
- Use environment variables for secrets
- Back up your DB before major changes
- **Configure connection pools for cloud providers** (prevent ECONNRESET)
- **Use transaction pooling for serverless** (Vercel, Netlify functions)
- **Set idle timeout lower than provider timeout** (avoid dead connections)

## Connection Stability & Pooling

**When Adopted:** Epic 13 Story 13.3  
**Why:** Prevent ECONNRESET/ECONNREFUSED errors from cloud database timeouts  
**Use Case:** Production deployments, long-running development servers

### Problem: Idle Connection Timeouts

Cloud database providers (Supabase, Railway, Neon) close idle connections after 10-15 minutes. Prisma may attempt to reuse closed connections, causing errors.

**Symptoms:**

- ECONNRESET errors after idle periods
- "Connection terminated unexpectedly"
- Works fine after server restart
- Errors occur >10min after last database query

### Solution: Connection Pool Configuration

```javascript
// apps/backend/src/infrastructure/database/client.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],

  // Connection pool configuration (Supabase/cloud providers)
  pool: {
    max: 10, // Maximum pool size
    min: 2, // Minimum connections
    idleTimeoutMillis: 30000, // Close idle connections after 30s (before provider timeout)
    connectionTimeoutMillis: 10000, // Fail fast if can't acquire connection
    keepAlive: true, // TCP keep-alive packets
    keepAliveInitialDelayMillis: 10000, // Start keep-alive after 10s
  },
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export default prisma;
```

**Configuration Rationale:**

- `idleTimeoutMillis: 30000` — Close connections before provider timeout (10min)
- `connectionTimeoutMillis: 10000` — Fail fast if pool exhausted
- `keepAlive: true` — Detect dead connections early
- `max: 10` — Leave headroom in provider limits (e.g., Supabase 50 connections)

### Diagnosing Connection Issues

**Check 1: Verify connection string**

```bash
# Print DATABASE_URL (hide password)
echo $env:DATABASE_URL -replace ':[^@]+@', ':***@'
```

**Check 2: Test raw connection**

```bash
# Using psql
psql "$DATABASE_URL"

# Using Prisma
npx prisma db pull
```

**Check 3: Monitor connection count**

```sql
-- Run in Supabase SQL Editor or psql
SELECT count(*) as active_connections
FROM pg_stat_activity
WHERE datname = 'postgres';
```

**Check 4: Review provider logs**

- Supabase: Dashboard → Logs → Postgres Logs
- Railway: Project → Logs
- Look for: connection closed, idle timeout, max connections

## When to Use

- Production, staging, or persistent dev environments
- All cloud-hosted PostgreSQL (Supabase, Railway, Neon)
- Serverless functions (Vercel, Netlify)
- Development servers running >10min

---

See also: [Cloud Database Providers](./backend-database-cloud.md), [SQLite for Local Dev](./backend-database-sqlite.md), [Supabase Setup Guide](./supabase-setup-guide.md)
