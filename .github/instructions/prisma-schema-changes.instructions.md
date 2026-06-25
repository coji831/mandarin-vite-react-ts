---
description: "Use when editing Prisma schema, adding database models, changing columns, or running migrations. Covers safety checks and required commands."
applyTo: "**/schema.prisma"
---

# Prisma Schema Change Protocol

## Required Steps (in order)

1. Edit `schema.prisma` with your model/column changes
2. Run `npx prisma generate` in `apps/backend/` to regenerate the Prisma client
3. Run `npx prisma migrate dev --name <short-description>` to create a migration
4. Verify the migration file was generated in `apps/backend/prisma/migrations/`
5. Run tests to confirm no 500 errors from missing columns/tables

## Never Do

- ❌ Never use `prisma db push` for schema changes in production — it doesn't create proper migrations
- ❌ Never skip `prisma generate` after schema edits — the app will use an outdated client
- ❌ Never edit migration files manually

## Common Errors & Fixes

- **"Model not found" / 500 errors**: You forgot `prisma generate` — run it now
- **"Column doesn't exist"**: Schema drift — run `prisma migrate dev` to sync
- **"Constraint failed"**: Check for existing data that violates the new constraint

## DO Example

```bash
cd apps/backend
npx prisma generate
npx prisma migrate dev --name add-quiz-attempt-model
```
