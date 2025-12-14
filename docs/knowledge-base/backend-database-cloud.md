# Cloud Database Providers

**When Adopted:** Epic 13

## Why

Managed, scalable, and easy to set up for production or staging.

## Use Case

- No local DB ops
- Easy backups and scaling
- Team access

## Providers

- Railway
- Supabase
- Render
- AWS RDS
- Heroku

## Example: Railway

1. Go to https://railway.app/
2. Create project → Add Plugin → PostgreSQL
3. Copy connection string to `.env` as `DATABASE_URL`

## Example: Supabase

1. Go to https://supabase.com/
2. Create project
3. Get connection string from Project Settings → Database

## General Tips

- Use strong passwords
- Never commit credentials
- Whitelist backend IPs if needed

---

See also: [PostgreSQL Setup](./backend-database-postgres.md), [SQLite for Local Dev](./backend-database-sqlite.md)
