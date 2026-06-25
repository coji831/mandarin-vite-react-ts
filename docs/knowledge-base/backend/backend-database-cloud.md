# Cloud Database Providers

**Category:** Backend Infrastructure  
**Last Updated:** January 9, 2026

---

## Overview

Cloud database providers offer managed PostgreSQL, MySQL, and other databases without infrastructure management. They handle backups, scaling, security patches, and monitoring, allowing developers to focus on application logic.

---

## Why Use Cloud Databases

**Benefits:**

- **Zero Infrastructure Management**: No server setup, OS updates, or hardware maintenance
- **Automatic Backups**: Point-in-time recovery, scheduled backups
- **High Availability**: Built-in replication, failover mechanisms
- **Easy Scaling**: Vertical (CPU/RAM) and horizontal (read replicas) scaling
- **Team Access**: Shared environments with role-based access control
- **Security**: SSL/TLS connections, encryption at rest, IP whitelisting

**Use Cases:**

- Production deployments
- Staging/testing environments
- Team collaboration (shared database)
- Prototypes needing quick setup

---

## Popular Providers

| Provider     | Best For            | Free Tier       | Key Features                            |
| ------------ | ------------------- | --------------- | --------------------------------------- |
| **Supabase** | Postgres + APIs     | ✅ 500MB        | Built-in auth, real-time, RESTful API   |
| **Railway**  | Simple deploys      | ✅ $5/mo credit | One-click Postgres, integrated with Git |
| **Render**   | Full-stack apps     | ✅ 90 days free | Auto-deploy from Git, managed Postgres  |
| **Neon**     | Serverless Postgres | ✅ 3GB storage  | Auto-scaling, branching databases       |
| **AWS RDS**  | Enterprise          | ❌ Paid         | Multi-AZ, performance insights, Aurora  |
| **Heroku**   | Legacy apps         | ⚠️ Limited      | Simple add-on system (sunset free tier) |

---

## Connection Pool Configuration

### What is Connection Pooling?

A connection pool maintains a set of reusable database connections, avoiding the overhead of creating new connections for every query.

**Without Pooling:**

```
Request 1 → New Connection → Query → Close Connection
Request 2 → New Connection → Query → Close Connection (slow!)
```

**With Pooling:**

```
Request 1 → Get Connection from Pool → Query → Return to Pool
Request 2 → Reuse Connection from Pool → Query → Return to Pool (fast!)
```

### Why Pooling Matters in Cloud Environments

**1. Connection Limits**

Cloud databases have connection limits based on plan:

- Supabase Free: ~20 direct connections
- Railway Hobby: ~100 connections
- AWS RDS t3.micro: ~85 connections

**2. Serverless/Lambda Cold Starts**

Each serverless function instance creates its own connections:

```
10 concurrent requests × 5 connections each = 50 connections
```

Without pooling, you hit limits quickly.

**3. Connection Overhead**

Opening a new PostgreSQL connection costs ~50-100ms. Pooling eliminates this latency.

### Connection Pooling Strategies

**1. Application-Level Pooling (Prisma)**

```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

// Configure connection pool
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Prisma default pool settings:
  // connection_limit = 10 (can override with ?connection_limit=20 in URL)
});
```

**URL Parameters for Pooling:**

```env
# Standard connection
DATABASE_URL=postgresql://user:pass@host:5432/db

# With connection pool settings
DATABASE_URL=postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20
```

**2. External Connection Pooler (PgBouncer)**

PgBouncer sits between app and database, managing a shared pool:

```
Your App (100 connections)
    ↓
PgBouncer (pools to 10 database connections)
    ↓
PostgreSQL (10 actual connections)
```

**Supabase Example (Built-in PgBouncer):**

```env
# Direct connection (limited)
DATABASE_URL=postgresql://postgres.[ref]:[pwd]@db.[ref].supabase.co:5432/postgres

# Pooled connection (recommended)
DATABASE_URL=postgresql://postgres.[ref]:[pwd]@db.[ref].supabase.co:6543/postgres?pgbouncer=true
```

Note the port: `5432` (direct) vs `6543` (pooled via PgBouncer).

### Pool Configuration Parameters

| Parameter          | Description                            | Default | Recommendation                            |
| ------------------ | -------------------------------------- | ------- | ----------------------------------------- |
| `connection_limit` | Max connections in pool                | 10      | Set based on expected concurrent requests |
| `pool_timeout`     | Max wait time for connection (seconds) | 10      | Increase if seeing timeout errors         |
| `connect_timeout`  | Max time to establish connection       | 5       | Keep low to fail fast                     |

**Example Configuration:**

```env
# Development (low traffic)
DATABASE_URL=postgresql://localhost:5432/db?connection_limit=5&pool_timeout=10

# Production (high traffic, using PgBouncer)
DATABASE_URL=postgresql://user:pass@host:6543/db?pgbouncer=true&connection_limit=20
```

### Connection Pool Best Practices

**1. Single Prisma Instance**

```typescript
// ❌ BAD: New pool per request
app.get("/users", async (req, res) => {
  const prisma = new PrismaClient(); // New pool!
  const users = await prisma.user.findMany();
  await prisma.$disconnect();
});

// ✅ GOOD: Shared singleton
// lib/prisma.ts
export const prisma = new PrismaClient();

// routes/users.ts
import { prisma } from "../lib/prisma";
app.get("/users", async (req, res) => {
  const users = await prisma.user.findMany(); // Reuses pool
});
```

**2. Graceful Shutdown**

```typescript
// Disconnect on process exit
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
```

**3. Monitor Pool Usage**

```typescript
// Log active connections periodically
setInterval(async () => {
  const result = await prisma.$queryRaw`
    SELECT count(*) FROM pg_stat_activity 
    WHERE datname = current_database()
  `;
  console.log("Active connections:", result);
}, 60000);
```

**4. Use PgBouncer for Serverless**

Serverless functions should ALWAYS use pooled connections:

```env
# Vercel/Netlify/AWS Lambda
DATABASE_URL=postgresql://user:pass@host:6543/db?pgbouncer=true
```

### Troubleshooting Connection Issues

**Error: "Too many clients already"**

**Cause:** Exceeded database connection limit

**Solutions:**

1. Enable connection pooling (PgBouncer)
2. Reduce `connection_limit` in app
3. Upgrade database plan
4. Check for connection leaks (not calling `$disconnect()`)

**Error: "Connection pool timeout"**

**Cause:** All pool connections busy, no free slots

**Solutions:**

1. Increase `connection_limit`
2. Increase `pool_timeout`
3. Optimize slow queries
4. Add database indexes

**Error: "Connection refused"**

**Cause:** Network/firewall issue

**Solutions:**

1. Check IP whitelist in cloud provider
2. Verify SSL/TLS settings
3. Confirm database is running
4. Test with `psql` command-line

---

## Provider-Specific Setup

### Supabase

**1. Create Project:**

1. Go to [supabase.com](https://supabase.com/)
2. New Project → Choose region, database password
3. Wait ~2 minutes for provisioning

**2. Get Connection Strings:**

Project Settings → Database → Connection String

```env
# Direct connection (migration, dev)
DATABASE_URL=postgresql://postgres.[ref]:[pwd]@db.[ref].supabase.co:5432/postgres

# Pooled connection (production)
DATABASE_URL=postgresql://postgres.[ref]:[pwd]@db.[ref].supabase.co:6543/postgres?pgbouncer=true
```

**3. Configure Prisma:**

```bash
# Run migrations using direct connection
DATABASE_URL=postgresql://...5432/postgres npx prisma migrate dev

# App uses pooled connection
# .env.local
DATABASE_URL=postgresql://...6543/postgres?pgbouncer=true
```

**Supabase-Specific Tips:**

- Use port 6543 for apps (PgBouncer)
- Use port 5432 for migrations only
- Enable connection pooling in Project Settings
- Monitor usage in Database → Logs

### Railway

**1. Create Project:**

1. Go to [railway.app](https://railway.app/)
2. New Project → Add Service → Database → PostgreSQL
3. Instant provisioning

**2. Get Connection String:**

Database Service → Connect → Postgres Connection URL

```env
DATABASE_URL=postgresql://postgres:password@containers-us-west-123.railway.app:1234/railway
```

**3. Configure Connection Pooling:**

Railway doesn't include PgBouncer by default. Add Prisma pooling:

```env
DATABASE_URL=postgresql://postgres:password@host:port/db?connection_limit=10&pool_timeout=20
```

**Railway-Specific Tips:**

- Database and app in same project share private network
- Use public URL for external access
- Set up CI/CD with GitHub integration
- Monitor usage in project dashboard

### Render

**1. Create Database:**

1. Go to [render.com](https://render.com/)
2. New → PostgreSQL → Choose plan
3. Note database name, user, password

**2. Get Connection String:**

Database → Connect → External Connection String

```env
# External (from internet)
DATABASE_URL=postgresql://user:pass@oregon-postgres.render.com/db

# Internal (from Render services)
DATABASE_URL=postgresql://user:pass@db:5432/db
```

**Render-Specific Tips:**

- Free tier databases delete after 90 days
- Use internal connection string for apps on Render
- Enable automatic backups (paid plans)
- PgBouncer not included, use Prisma pooling

---

## Security Best Practices

**1. Never Commit Connection Strings**

```gitignore
# .gitignore
.env
.env.local
.env.production
```

**2. Use Environment Variables**

```typescript
// ❌ Hardcoded
const prisma = new PrismaClient({
  datasources: { db: { url: "postgresql://user:pass@host/db" } },
});

// ✅ Environment variable
const prisma = new PrismaClient(); // Reads DATABASE_URL from .env
```

**3. SSL/TLS Connections**

```env
# Require SSL in production
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
```

**4. Rotate Passwords**

- Rotate database passwords quarterly
- Update connection strings in all environments
- Use secret managers (AWS Secrets Manager, GCP Secret Manager)

**5. IP Whitelisting**

Configure allowed IPs in database provider:

- Supabase: Database → Settings → Connection Pooling → IP Restrictions
- Railway: Public Networking → Allowlist
- Render: Database → Access Control

---

## General Tips

- **Use strong passwords**: 32+ characters, mix of symbols
- **Enable automatic backups**: Point-in-time recovery
- **Monitor query performance**: Use provider dashboards
- **Test connection pooling**: Load test to verify pool settings
- **Document connection strings**: Keep secure notes for team

---

**Related Patterns:**

- [PostgreSQL Setup](./backend-database-postgres.md) - Local development
- [SQLite for Local Dev](./backend-database-sqlite.md) - Alternative for prototypes
- [Backend Architecture](./backend-architecture.md) - Repository pattern with Prisma

---

**Last Updated:** January 9, 2026
