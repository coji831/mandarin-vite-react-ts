# Database Setup Guide

This document explains how to set up the PostgreSQL database for the Mandarin Learning App backend.

## Quick Start (Development)

### Option 1: Local PostgreSQL

1. **Install PostgreSQL** (if not already installed):

   - Windows: Download from https://www.postgresql.org/download/windows/
   - Mac: `brew install postgresql@15`
   - Linux: `sudo apt-get install postgresql-15`

2. **Create Database**:

   ```bash
   # Start PostgreSQL service (if not running)
   # Windows: Check Services app
   # Mac: brew services start postgresql@15
   # Linux: sudo systemctl start postgresql

   # Create database
   createdb mandarin_dev
   ```

3. **Configure DATABASE_URL**:
   Add to root `.env.local`:

   ```
   DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/mandarin_dev?schema=public"
   ```

   Replace `yourpassword` with your PostgreSQL password.

4. **Run Migrations**:

   ```bash
   cd apps/backend
   npm run db:migrate
   ```

5. **Seed Database**:
   ```bash
   npm run db:seed
   ```

### Option 2: Prisma Dev Database (Cloud - Free)

Fastest way to get started without installing PostgreSQL locally:

```bash
cd apps/backend
npx create-db
```

This will:

- Create a free Prisma Postgres database
- Automatically configure DATABASE_URL
- Set up connection pooling

Then run migrations and seed:

```bash
npm run db:migrate
npm run db:seed
```

### Option 3: Other Cloud Providers

**Supabase** (Free tier available):

1. Create account at https://supabase.com
2. Create new project
3. Copy connection string from Settings → Database
4. Add to `.env.local` as `DATABASE_URL`

**Neon** (Free tier available):

1. Create account at https://neon.tech
2. Create new project
3. Copy connection string
4. Add to `.env.local` as `DATABASE_URL`

## Database Scripts

```bash
# Generate Prisma Client after schema changes
npm run db:generate

# Create and apply migration (development)
npm run db:migrate

# Apply pending migrations (production)
npm run db:migrate:deploy

# Push schema without migration (development only)
npm run db:push

# Seed database with test data
npm run db:seed

# Open Prisma Studio (database GUI)
npm run db:studio

# Reset database (WARNING: deletes all data)
npm run db:reset
```

## Prisma Studio

View and edit your database visually:

```bash
npm run db:studio
```

Opens at http://localhost:5555

## Schema Changes

1. Edit `prisma/schema.prisma`
2. Run `npm run db:migrate` to create and apply migration
3. Commit both the schema file and migration files

## Connection Pooling

For production (Vercel serverless), use connection pooling:

**Option 1: Prisma Data Proxy** (Recommended for serverless):

```bash
npx prisma-data-proxy deploy
```

**Option 2: PgBouncer** (Traditional setup):
Set `DATABASE_URL` to PgBouncer connection string.

**Option 3: Database-native pooling**:

- Supabase: Use "Transaction" mode connection string
- Neon: Use "pooled" connection string

## Troubleshooting

**Error: "Can't reach database server"**

- Check PostgreSQL is running
- Verify DATABASE_URL is correct
- Check firewall/network settings

**Error: "Database does not exist"**

- Run `createdb mandarin_dev` (or your database name)

**Error: "Prisma Client not generated"**

- Run `npm run db:generate`

**Seed fails with "User already exists"**

- This is normal on re-runs
- Seed uses `upsert` to handle duplicates

## Security Notes

- Never commit `.env.local` or DATABASE_URL
- Use strong passwords for production databases
- Enable SSL for production connections
- Use separate databases for dev/staging/prod
