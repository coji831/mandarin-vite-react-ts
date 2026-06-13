# Database Setup

> **Redirect:** This content has moved to the centralized [Database Setup Guide](../docs/guides/setup/database.md), which covers all database options (local PostgreSQL, Prisma Cloud, Supabase, Neon), migration commands, Prisma Client usage, schema management, connection pooling, and troubleshooting.

## Quick Reference

```bash
cd apps/backend

npm run db:generate    # Generate Prisma Client after schema changes
npm run db:migrate     # Create and apply migration (development)
npm run db:migrate:deploy  # Apply pending migrations (production)
npm run db:push        # Push schema without migration (dev only)
npm run db:seed        # Seed database with test data
npm run db:studio      # Open Prisma Studio (http://localhost:5555)
npm run db:reset       # Reset database (WARNING: deletes all data)
```

> **Full instructions:** See [Database Setup Guide](../docs/guides/setup/database.md) for local setup, cloud options, connection pooling, and security notes.
