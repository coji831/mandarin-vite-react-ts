# Database Setup

> **Redirect:** This content has moved to the centralized [Database Setup Guide](../docs/guides/setup/database.md), which covers local PostgreSQL, Prisma Cloud, and Neon (Supabase is documented in the legacy [Supabase Setup Guide](../docs/guides/references/supabase-setup-guide.md)), migration commands, Prisma Client usage, schema management, connection pooling, and troubleshooting.

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
npm run db:verify      # Verify data lifecycle / integrity
npm run db:verify:deep # Deep verification of data lifecycle
npm run db:verify:pipeline  # Verify seed pipeline output
npm run db:checksum    # Checksum-based pipeline verification
```

> **Full instructions:** See [Database Setup Guide](../docs/guides/setup/database.md) for local setup, cloud options, connection pooling, and security notes.
