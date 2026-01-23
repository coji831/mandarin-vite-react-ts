# Supabase Setup Guide

Quick setup guide for Supabase PostgreSQL database with Prisma ORM.

## Prerequisites

- Supabase account ([supabase.com](https://supabase.com/))
- Node.js 18+
- Prisma installed: `npm install prisma @prisma/client`

## Setup Steps

**1. Create Supabase Project:**

- Go to [supabase.com](https://supabase.com/)
- New Project → Choose region, set database password
- Wait ~2 minutes for provisioning

**2. Get Connection String:**

Project Settings → Database → Connection String (Transaction Pooler)

```env
# .env.local - Use pooled connection (port 6543)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true"
```

**⚠️ Use port 6543 (pooled), not 5432 (direct)**

**3. Configure Prisma Schema:**

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

**4. Run Migrations:**

```bash
npx prisma migrate dev --name init
```

## Connection Pooling

Supabase Free Tier: ~20 direct connections. Use PgBouncer pooler (port 6543) to avoid limits.

**Connection URLs:**

```env
# Pooled (recommended for apps)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:6543/postgres?pgbouncer=true"

# Direct (migrations only)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"
```

**Prisma Client Singleton:**

```typescript
// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
```

**Learn more:** [Cloud Database Providers](../knowledge-base/backend-database-cloud.md#connection-pool-configuration) - Pooling strategies, PgBouncer setup, connection limits

## Common Tasks

**Generate Prisma Client:**

```bash
npx prisma generate
```

**View Database:**

```bash
npx prisma studio
```

**Reset Database:**

```bash
npx prisma migrate reset
```

## Troubleshooting

**ECONNRESET errors:**

- Use port 6543 (pooled), not 5432
- Add `?pgbouncer=true` to URL
- Implement Prisma client singleton

**"Too many connections":**

- Switch to pooled connection (port 6543)
- Reduce connection_limit in URL
- Check for connection leaks

**Migration fails:**

- Use direct connection (port 5432) for migrations
- Check database password is correct
- Verify project is provisioned (Settings → Database)

## Reference

- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Prisma with Supabase](https://www.prisma.io/docs/guides/database/supabase)

**Learn more:**

- [Cloud Database Providers](../knowledge-base/backend-database-cloud.md) - Supabase setup, pooling deep dive, security practices

---

**Last Updated:** January 9, 2026
