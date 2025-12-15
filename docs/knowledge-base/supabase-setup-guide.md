# Supabase Setup Guide

Complete guide for setting up Supabase PostgreSQL database for the Mandarin Learning App.

## 📋 Table of Contents

1. [What is Supabase](#what-is-supabase)
2. [Create Account & Project](#create-account--project)
3. [Get Database Connection String](#get-database-connection-string)
4. [Configure Local Environment](#configure-local-environment)
5. [Run Migrations](#run-migrations)
6. [Verify Setup](#verify-setup)
7. [Supabase Dashboard Features](#supabase-dashboard-features)
8. [Production Best Practices](#production-best-practices)
9. [Troubleshooting](#troubleshooting)

---

## What is Supabase

**Supabase** is an open-source Firebase alternative that provides:

- PostgreSQL database (with extensions)
- Built-in authentication
- Real-time subscriptions
- Storage for files
- Auto-generated REST APIs
- Connection pooling (PgBouncer)
- Database GUI (Table Editor)

**Free Tier Limits:**

- 500MB database storage
- 2GB bandwidth/month
- 50MB file storage
- Unlimited API requests
- No credit card required

**Perfect for:**

- Development & testing
- Small production apps
- Prototyping
- Learning PostgreSQL

---

## Create Account & Project

### Step 1: Sign Up

1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"**
3. Sign up with:
   - GitHub (recommended)
   - Google
   - Email

### Step 2: Create Organization

1. After sign-up, click **"New organization"**
2. Enter organization name: `mandarin-app` (or your preference)
3. Choose **"Free"** plan
4. Click **"Create organization"**

### Step 3: Create Project

1. Click **"New project"**
2. Fill in project details:
   - **Name**: `mandarin-learning-dev` (for development)
   - **Database Password**: Generate strong password (save it!)
   - **Region**: Choose closest to you
     - `East US (North Virginia)` - US East Coast
     - `West US (Oregon)` - US West Coast
     - `Central EU (Frankfurt)` - Europe
     - `Southeast Asia (Singapore)` - Asia
   - **Pricing Plan**: Free
3. Click **"Create new project"**
4. Wait ~2 minutes for database provisioning

### Step 4: Save Credentials

**IMPORTANT:** Save these immediately (you'll need them later):

- Project URL: `https://xxxxx.supabase.co`
- Project API Key (anon, public)
- Project API Key (service_role, secret)
- Database Password (you just created)

---

## Get Database Connection String

### Method 1: Connection Info Page (Recommended)

1. In Supabase Dashboard, go to **Settings** (⚙️ icon in sidebar)
2. Click **"Database"**
3. Scroll to **"Connection string"** section
4. Select **"URI"** tab
5. Copy the connection string:
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
   ```
6. **Important:** Replace `[YOUR-PASSWORD]` with the database password you created

### Method 2: Connection Pooling (For Production)

Use **Transaction Mode** for Prisma (better for serverless):

1. Same page, scroll to **"Connection pooling"**
2. Mode: **Transaction** (recommended for Prisma)
3. Port: `6543` (pooling port, not default 5432)
4. Copy:
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

### Connection String Parts Explained

```
postgresql://postgres.abcdefghij:password123@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
│          │                      │           │                                       │    │         │
│          │                      │           │                                       │    │         └─ Use connection pooling
│          │                      │           │                                       │    └─ Database name
│          │                      │           │                                       └─ Port (6543 = pooling, 5432 = direct)
│          │                      │           └─ Host (region-specific)
│          │                      └─ Your database password
│          └─ Username with project reference
└─ Protocol
```

---

## Configure Local Environment

### Step 1: Update `.env` File

```bash
# Navigate to backend directory
cd apps/backend

# Edit .env file (or create if doesn't exist)
```

Add/update the following:

```bash
# Database Configuration - Supabase PostgreSQL
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Server Configuration
PORT=3001
NODE_ENV=development

# Supabase Configuration (optional, for future auth integration)
SUPABASE_URL="https://[PROJECT-REF].supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

**Important Parameters:**

- `pgbouncer=true` - Enable connection pooling
- `connection_limit=1` - Limit connections per serverless function
- Port `6543` - Transaction pooling (better for Prisma)

### Step 2: Add to `.gitignore`

Ensure `.env` is ignored:

```bash
# apps/backend/.gitignore
.env
.env.local
.env*.local
```

### Step 3: Update `.env.example`

```bash
# apps/backend/.env.example
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@[HOST].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
PORT=3001
NODE_ENV=development
SUPABASE_URL="https://[PROJECT-REF].supabase.co"
SUPABASE_ANON_KEY="your-anon-key-here"
```

---

## Run Migrations

### Step 1: Update Schema (if not already PostgreSQL)

```bash
# Ensure apps/backend/prisma/schema.prisma has:
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Step 2: Install PostgreSQL Client

```bash
cd apps/backend
npm install pg
```

### Step 3: Clean Old SQLite Data (if switching)

```bash
# Remove SQLite files
rm -f prisma/dev.db*
rm -rf prisma/migrations

# Or on Windows PowerShell
Remove-Item prisma/dev.db* -ErrorAction SilentlyContinue
Remove-Item prisma/migrations -Recurse -Force -ErrorAction SilentlyContinue
```

### Step 4: Generate Prisma Client

```bash
npx prisma generate
```

### Step 5: Create and Apply Migration

```bash
# This will create migration files and apply to Supabase
npx prisma migrate dev --name init

# You'll see:
# - Migration files created in prisma/migrations/
# - Tables created in Supabase
# - Prisma Client regenerated
```

### Step 6: Seed Database

```bash
npm run db:seed
```

Expected output:

```
🌱 Starting database seed...
✅ Created test users
✅ Created 5 vocabulary words
✅ Created sample progress records
🎉 Database seed completed successfully!
```

---

## Verify Setup

### 1. Check Prisma Studio (Local)

```bash
npm run db:studio
# Opens http://localhost:5555
# Browse User, Session, Progress, VocabularyWord tables
```

### 2. Check Supabase Table Editor (Cloud)

1. Go to Supabase Dashboard
2. Click **"Table Editor"** in sidebar
3. You should see 4 tables:
   - `User`
   - `Session`
   - `Progress`
   - `VocabularyWord`
4. Click any table to view data
5. Verify test users exist:
   - test@example.com
   - demo@example.com

### 3. Test Database Connection

Create a test script:

```typescript
// apps/backend/test-db-connection.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testConnection() {
  try {
    const users = await prisma.user.findMany();
    console.log("✅ Database connection successful!");
    console.log(
      `Found ${users.length} users:`,
      users.map((u) => u.email)
    );
  } catch (error) {
    console.error("❌ Database connection failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
```

Run it:

```bash
npx tsx test-db-connection.ts
```

---

## Supabase Dashboard Features

### Table Editor

- **Location:** Left sidebar → Table Editor
- **Features:**
  - View all tables and data
  - Add/edit/delete rows manually
  - Filter and search
  - Export to CSV
  - See table relationships

### SQL Editor

- **Location:** Left sidebar → SQL Editor
- **Features:**
  - Run custom SQL queries
  - Save queries as snippets
  - View query history
  - Query templates

**Example Queries:**

```sql
-- View all users
SELECT * FROM "User";

-- Count vocabulary words by level
SELECT level, COUNT(*) as count
FROM "VocabularyWord"
GROUP BY level;

-- Find users with progress
SELECT u.email, COUNT(p.id) as progress_count
FROM "User" u
LEFT JOIN "Progress" p ON u.id = p."userId"
GROUP BY u.id, u.email;
```

### Database Settings

- **Location:** Settings → Database
- **Features:**
  - Connection strings
  - Connection pooling config
  - Reset database password
  - Enable extensions
  - Backups (paid plans)

### Logs

- **Location:** Left sidebar → Logs
- **Features:**
  - Query logs
  - API logs
  - Function logs
  - Error tracking

### Useful Extensions (Already Enabled)

Supabase pre-enables useful PostgreSQL extensions:

```sql
-- Check enabled extensions
SELECT * FROM pg_extension;

-- Commonly enabled:
-- uuid-ossp (UUID generation)
-- pgcrypto (encryption)
-- pgjwt (JWT tokens)
```

---

## Production Best Practices

### 1. Separate Environments

Create 3 projects:

| Project            | Purpose     | DATABASE_URL              |
| ------------------ | ----------- | ------------------------- |
| `mandarin-dev`     | Development | Dev connection string     |
| `mandarin-staging` | Testing/QA  | Staging connection string |
| `mandarin-prod`    | Production  | Prod connection string    |

### 2. Connection Pooling

Always use transaction mode for Prisma in serverless:

```bash
# Good (pooled)
postgresql://...pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1

# Avoid (direct connection)
postgresql://...supabase.com:5432/postgres
```

### 3. Migration Strategy

```bash
# Development: Interactive migrations
npx prisma migrate dev

# Production: Non-interactive deployment
npx prisma migrate deploy
```

### 4. Vercel Environment Variables

```bash
# Set via Vercel Dashboard or CLI
vercel env add DATABASE_URL production
# Paste: postgresql://...pooler.supabase.com:6543/...

# For preview/development branches
vercel env add DATABASE_URL preview
vercel env add DATABASE_URL development
```

### 5. Backup Strategy

**Free Tier:**

- Daily automatic backups (7 days retention)
- Cannot download backups
- Can restore via support

**Pro Tier ($25/month):**

- Daily backups with PITR (Point-In-Time Recovery)
- Download backups
- Longer retention

**Manual Backup (Free Tier):**

```bash
# Using pg_dump (requires PostgreSQL tools installed)
pg_dump "postgresql://postgres.[PROJECT-REF]:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" > backup.sql

# Or use Supabase CLI
supabase db dump -f backup.sql
```

### 6. Monitoring

**Free Tier Monitoring:**

- Database size: Settings → Database → Database size
- API requests: Home → Usage
- Connection count: SQL Editor → `SELECT count(*) FROM pg_stat_activity;`

**Alerts:**

- Set up email notifications for:
  - Database size approaching limit
  - High error rates
  - Unusual connection spikes

---

## Troubleshooting

### Issue: "P1001: Can't reach database server"

**Causes:**

- Wrong connection string
- Password not replaced in `[YOUR-PASSWORD]`
- Network/firewall blocking connection
- Supabase project paused (inactive for 7 days)

**Solutions:**

```bash
# 1. Verify DATABASE_URL is correct
echo $env:DATABASE_URL  # Windows PowerShell
echo $DATABASE_URL      # Linux/Mac

# 2. Test raw connection
psql "postgresql://postgres.[PROJECT]:[PASSWORD]@...pooler.supabase.com:6543/postgres"

# 3. Check Supabase project status (dashboard)

# 4. Unpause project if needed (Supabase Dashboard → Project Settings)
```

### Issue: "P1017: Server has closed the connection"

**Cause:** Connection limit exceeded

**Solution:**

```bash
# Add/update connection_limit in DATABASE_URL
DATABASE_URL="...?pgbouncer=true&connection_limit=1"

# Use transaction pooling (port 6543)
# Close connections explicitly in code
await prisma.$disconnect();
```

### Issue: Migration fails with "relation already exists"

**Cause:** Table already exists from previous migration

**Solutions:**

```bash
# Option 1: Reset database (DEV ONLY - DESTROYS DATA!)
npx prisma migrate reset

# Option 2: Mark migration as applied without running
npx prisma migrate resolve --applied [MIGRATION_NAME]

# Option 3: Create new migration from current state
npx prisma db pull  # Introspect existing database
npx prisma migrate dev --name sync_existing
```

### Issue: Slow queries in development

**Cause:** Missing indexes or connection pooling disabled

**Solutions:**

```sql
-- Check query performance
EXPLAIN ANALYZE SELECT * FROM "User" WHERE email = 'test@example.com';

-- Add index if missing
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");

-- Check active connections
SELECT count(*) FROM pg_stat_activity;
```

### Issue: "Database has been paused"

**Cause:** Free tier projects pause after 7 days of inactivity

**Solution:**

1. Go to Supabase Dashboard
2. Click "Restore" button
3. Wait ~2 minutes for reactivation
4. Re-run migrations if needed

### Issue: Can't see tables in Supabase Table Editor

**Cause:** Tables in wrong schema or not yet migrated

**Solutions:**

```sql
-- Check which schema tables are in
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema');

-- Ensure Prisma uses public schema (should be default)
-- In schema.prisma:
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Add if needed: schemas = ["public"]
}
```

---

## Useful SQL Snippets

### Reset test data

```sql
-- Delete all data (keeps tables)
TRUNCATE TABLE "Progress", "Session", "VocabularyWord", "User" CASCADE;
```

### Check database size

```sql
SELECT
  pg_size_pretty(pg_database_size(current_database())) as size;
```

### View table sizes

```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Find slow queries (if enabled)

```sql
SELECT
  query,
  calls,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

---

## Next Steps

After Supabase setup:

1. ✅ **Story 13.2 Complete** - Database configured
2. 🚀 **Story 13.3** - Implement JWT authentication
3. 🔐 **Story 13.4** - Build progress API endpoints
4. ⚡ **Story 13.5** - Add Redis caching layer
5. 🏗️ **Story 13.6** - Refactor to clean architecture

---

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Prisma + Supabase Guide](https://www.prisma.io/docs/guides/database/supabase)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Connection Pooling Guide](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooling)

---

## Support

**Supabase:**

- Community: [Discord](https://discord.supabase.com)
- Issues: [GitHub](https://github.com/supabase/supabase)
- Docs: [supabase.com/docs](https://supabase.com/docs)

**Prisma:**

- Community: [Discord](https://pris.ly/discord)
- Docs: [prisma.io/docs](https://www.prisma.io/docs)
- Issues: [GitHub](https://github.com/prisma/prisma)
