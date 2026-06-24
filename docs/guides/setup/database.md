# Database Setup Guide

**Last Updated:** June 3, 2026  
**Purpose:** Comprehensive PostgreSQL and Prisma setup for local development and production  
**Audience:** Backend developers and DevOps engineers setting up the database layer

> **When to read this:** When setting up a database for local development, adding database migrations, troubleshooting connection issues, or preparing a production database deployment.

---

## Quick Start (5 minutes)

**Choose your database option:**

### Option 1: Local PostgreSQL (Recommended for Development)

**macOS (Homebrew):**

```bash
brew install postgresql@15
brew services start postgresql@15
createdb mandarin_dev
```

**Windows:**

```powershell
# Download and install from https://www.postgresql.org/download/windows/
# Create database using pgAdmin or command line
createdb -U postgres mandarin_dev
```

**Linux (Ubuntu/Debian):**

```bash
sudo apt-get install postgresql-15
sudo systemctl start postgresql
sudo createdb -U postgres mandarin_dev
```

**Configure `.env.local`:**

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/mandarin_dev?schema=public"
```

### Option 2: Prisma Cloud Database (No Installation)

Fastest way to get started:

```bash
cd apps/backend
npx create-db
```

This creates a free Prisma PostgreSQL database and auto-configures `DATABASE_URL`.

### Option 3: Supabase (Free Tier)

1. Sign up at https://supabase.com
2. Create project
3. Copy connection string from Settings → Database
4. Add to `.env.local` as `DATABASE_URL`

### Option 4: Neon (Free Tier)

1. Sign up at https://neon.tech
2. Create project
3. Copy connection string
4. Add to `.env.local` as `DATABASE_URL`

---

## Migration & Seeding

### Run Migrations

```bash
cd apps/backend

# Create and apply migration (development)
npm run db:migrate

# Apply pending migrations (production)
npm run db:migrate:deploy

# Push schema without migration (dev only)
npm run db:push
```

### Database Schema

Migrations create:

- **users** — User accounts, authentication
- **progress** — Vocabulary learning progress tracking
- **vocabulary_word** — Individual Mandarin words
- **category** — Thematic categories (food, business, etc.)
- **vocabulary_list** — User-created or predefined word lists
- **word_category** — Many-to-many: words ↔ categories
- **word_list** — Many-to-many: words ↔ lists

**View schema:** `apps/backend/prisma/schema.prisma`

### Load Vocabulary Data (Optional)

Populate vocabulary database from CSV:

```bash
cd apps/backend

# Clean existing data (if any)
npm run migrate:clean

# Load 500 HSK 3.0 Band 1 words
npm run migrate:vocab

# Load thematic categories
npm run migrate:categories

# Check migration progress
node scripts/check-migration-progress.js
```

**Result:**

- 500+ vocabulary words
- 7+ thematic categories
- Properly linked word-category relationships

---

## Prisma Client

### Generate Client

```bash
cd apps/backend
npm run db:generate
```

### Usage

**File:** `apps/backend/src/infrastructure/database/prismaClient.js`

```typescript
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

// Usage in services
export async function getUser(id: string) {
  return prisma.user.findUnique({ where: { id } });
}
```

### Schema Management

**File:** `apps/backend/prisma/schema.prisma`

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String  @id @default(cuid())
  email     String  @unique
  password  String
  createdAt DateTime @default(now())
  progress  Progress[]
}

model Progress {
  id       String  @id @default(cuid())
  userId   String
  wordId   String
  correct  Int     @default(0)
  incorrect Int    @default(0)
  user     User    @relation(fields: [userId], references: [id])
}
```

---

## Development Workflow

### Create New Migration

When you modify `schema.prisma`:

```bash
# Specify migration name
npx prisma migrate dev --name add_user_email

# Creates:
# - Migration file in prisma/migrations/
# - Updates database schema
# - Regenerates Prisma Client
```

### ⚠️ Migration Rule: Never Bypass the Migration System

**The problem:** Editing `schema.prisma` and then running `npx prisma db push` updates the database but **does not create a migration file**. The migration history becomes out of sync — a fresh deployment using `prisma migrate deploy` will miss those schema changes, causing runtime errors.

**The rule:** After every schema edit, always create a migration:

```bash
npx prisma migrate dev --name <short-description>
```

**Never** use `prisma db push` as a replacement for migrations. `db push` is only acceptable for:
- Rapid prototyping during early development (pre-initial migration)
- Temporary evaluation of schema ideas you plan to discard

**Naming convention:** Use kebab-case with the story/epic reference:

```bash
# Good: describes the change
npx prisma migrate dev --name add-review-item-display-fields

# Good: includes story reference for traceability
npx prisma migrate dev --name story-18-6-add-review-item-fields

# Bad: too vague
npx prisma migrate dev --name update-schema
```

**If you accidentally used `db push`** and need to fix the gap:

1. Check what's missing: `npx prisma migrate diff --from-config-datasource --to-schema`
2. Register the schema as-is without reapplying (if the DB already has the columns):
   ```bash
   npx prisma migrate dev --name describe-the-change --skip-generate
   ```
   Or if that fails, use `prisma migrate resolve`:
   ```bash
   npx prisma migrate resolve --applied <migration-name>
   ```
3. Verify: `npx prisma migrate status` should show "Database schema is up to date!"

**Before committing:** Always run:
```bash
npx prisma migrate status
npx prisma db push --dry-run  # confirms no drift
```

Migration files (`prisma/migrations/*/migration.sql`) **must** be committed to the repository. They are the source of truth for production deployments.

### Reset Database (Development Only)

```bash
# ⚠️ WARNING: Deletes all data
npx prisma migrate reset

# Equivalent to:
# 1. Drop database
# 2. Create fresh database
# 3. Run all migrations
# 4. Run seed script (if exists)
```

### View Database

**Using Prisma Studio (GUI):**

```bash
npx prisma studio
# Opens http://localhost:5555 with database explorer
```

**Using `psql` (command line):**

```bash
# Connect to database
psql -U postgres -d mandarin_dev

# Common commands
\dt              # List tables
\d users         # Describe users table
SELECT * FROM users;  # Query data
\q              # Quit
```

---

## Environment Variables

### Required for Development

```env
# .env.local (project root)
DATABASE_URL=postgresql://postgres:password@localhost:5432/mandarin_dev?schema=public
```

### Format

**Local PostgreSQL:**

```
postgresql://user:password@host:port/database?schema=public
```

**Supabase:**

```
postgresql://postgres.xxxxx:password@db.xxxxx.supabase.co:5432/postgres?schema=public&sslmode=require
```

**Neon:**

```
postgresql://user:password@pg.neon.tech/database?schema=public&sslmode=require
```

**Connection Pooling (Production):**

```
# Supabase with PgBouncer
postgresql://pgbouncer_user:password@db.xxxxx.supabase.co:6543/postgres?schema=public&sslmode=require
```

---

## Production Deployment

### Railway

1. **Create PostgreSQL service** in Railway dashboard
2. **Copy connection string** from Variables tab
3. **Set DATABASE_URL** environment variable in Railway backend service
4. **Run migrations** in deployment:

   ```bash
   # In Railway Procfile or deployment script
   npx prisma migrate deploy
   ```

### Vercel/Supabase

1. **Create Supabase project**
2. **Copy connection string**
3. **Set DATABASE_URL** in Vercel environment variables
4. **Deploy backend** to Railway/Heroku with migrations

### Database Backups

**Supabase:** Automatic daily backups (retention: 7 days)

**Railway:** Configure point-in-time recovery in PostgreSQL settings

**Manual Backup:**

```bash
# Export database
pg_dump -U postgres mandarin_dev > backup.sql

# Import backup
psql -U postgres mandarin_dev < backup.sql
```

---

## Troubleshooting

### Connection Refused

**Error:** `ECONNREFUSED localhost:5432`

**Solutions:**

1. Verify PostgreSQL is running

   ```bash
   # macOS
   brew services list | grep postgres

   # Linux
   sudo systemctl status postgresql
   ```

2. Check `DATABASE_URL` format
3. Verify credentials and port number

### "Relation does not exist"

**Error:** `relation "users" does not exist`

**Solution:** Migrations not applied

```bash
# Check migration status
npx prisma migrate status

# Apply pending migrations
npx prisma migrate dev
```

### Connection Timeout (Production)

**Cause:** Connection pool exhausted or database unreachable

**Solutions:**

1. Increase connection pool size in `DATABASE_URL`
2. Enable connection pooling (PgBouncer for Supabase)
3. Check database firewall rules
4. Verify backend can reach database (network/VPN)

### Schema Drift

**Error:** Database schema doesn't match Prisma schema

**Solution:**

```bash
# Push current schema (dev only)
npx prisma db push

# Or create migration
npx prisma migrate dev
```

---

## Best Practices

### Connection Pooling

For production, use connection pooling to limit concurrent connections:

```env
# Supabase with PgBouncer (port 6543)
DATABASE_URL=postgresql://user:pass@host:6543/db?sslmode=require

# Connection pool settings
# Supabase default: 60 connections
# Increase if needed in Settings → Database
```

### Prisma Client Lifecycle

**Single Instance (Recommended):**

```typescript
// infrastructure/database/prismaClient.js
export const prisma = new PrismaClient();

// Use throughout app
import { prisma } from "@/infrastructure/database/prismaClient";

const users = await prisma.user.findMany();
```

**Cleanup:**

```typescript
// app.listen(...) → on shutdown:
await prisma.$disconnect();
```

### Data Validation

Validate before inserting into database:

```typescript
import { z } from "zod";

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function createUser(input) {
  const data = createUserSchema.parse(input); // Throws if invalid
  return prisma.user.create({ data });
}
```

### Query Optimization

- Use `select` to fetch only needed fields
- Index frequently filtered columns
- Avoid N+1 queries (use `include` or batch queries)

```typescript
// ❌ N+1 query
const users = await prisma.user.findMany();
for (const user of users) {
  const progress = await prisma.progress.findMany({ where: { userId: user.id } });
}

// ✅ Optimized
const users = await prisma.user.findMany({
  include: { progress: true },
});
```

---

## Database Scripts

### Available Commands

```bash
cd apps/backend

# Generate Prisma Client
npm run db:generate

# Create and apply migration
npm run db:migrate

# Apply pending migrations (production)
npm run db:migrate:deploy

# Push schema without migration
npm run db:push

# Reset database (dev only)
npm run db:reset

# Open Prisma Studio
npm run db:studio

# Load vocabulary data
npm run migrate:vocab

# Load categories
npm run migrate:categories

# Clean vocabulary data
npm run migrate:clean

# Check migration progress
node scripts/check-migration-progress.js
```

---

## Reference

### Files

- **Schema:** `apps/backend/prisma/schema.prisma`
- **Migrations:** `apps/backend/prisma/migrations/`
- **Client:** `apps/backend/src/infrastructure/database/prismaClient.js`
- **Backend README:** `apps/backend/README.md`
- **Backend Database Doc:** `apps/backend/DATABASE.md`

### Related Guides

- [Backend Development Guide](./backend-development.md) — Server setup, services, middleware
- [Environment Setup Guide](../getting-started/environment-setup.md) — Environment variables
- [Backend Testing Guide](../testing/backend.md) — Database testing patterns
- [Troubleshooting Guide](../operations/troubleshooting.md) — Database connection errors

### External Resources

- [PostgreSQL Official](https://www.postgresql.org/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Supabase Setup](https://supabase.com/docs)
- [Neon Documentation](https://neon.tech/docs/introduction)

---

## Verification

Confirm your database setup is working:

```bash
cd apps/backend

# 1. Check Prisma can connect to the database
npx prisma db push
# Expected: "Your database is now in sync with your Prisma schema."

# 2. Open Prisma Studio to browse data
npx prisma studio
# Expected: Opens http://localhost:5555 with database explorer
```

**Expected result:** Prisma connects successfully, and Prisma Studio shows your database tables.

---

**Last Updated:** June 3, 2026
